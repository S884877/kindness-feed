'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ChainAct } from '@/lib/chain'

type TreeNode = ChainAct & { children: TreeNode[] }

type Placed = {
  node: TreeNode
  x: number
  y: number
  parentId: string | null
  isCollapsed: boolean
  hiddenCount: number
}

const NODE_W = 168
const NODE_H = 46
const GAP_X = 26
const GAP_Y = 72
const PAD = 40
const AUTO_COLLAPSE_DEPTH = 3

function buildTree(rows: ChainAct[]): TreeNode | null {
  const byId = new Map<string, TreeNode>()
  rows.forEach((r) => byId.set(r.id, { ...r, children: [] }))
  let root: TreeNode | null = null
  byId.forEach((node) => {
    if (!node.parent_id) { root = node; return }
    const parent = byId.get(node.parent_id)
    if (parent) parent.children.push(node)
    else root = root ?? node
  })
  byId.forEach((node) => node.children.sort((a, b) => a.created_at.localeCompare(b.created_at)))
  return root
}

function countDescendants(node: TreeNode): number {
  return node.children.reduce((sum, c) => sum + 1 + countDescendants(c), 0)
}

// classic leaf-slot layout: leaves get sequential x slots, parents center
// over their children — produces a real branching tree instead of a list.
function layout(root: TreeNode, collapsed: Set<string>): { placed: Placed[]; slots: number; maxDepth: number } {
  const placed: Placed[] = []
  const cursor = { next: 0 }
  let maxDepth = 0

  function place(node: TreeNode, depth: number, parentId: string | null): number {
    maxDepth = Math.max(maxDepth, depth)
    const isCollapsed = collapsed.has(node.id) && node.children.length > 0
    let slotX: number
    if (!isCollapsed && node.children.length > 0) {
      const childXs = node.children.map((c) => place(c, depth + 1, node.id))
      slotX = (childXs[0] + childXs[childXs.length - 1]) / 2
    } else {
      slotX = cursor.next
      cursor.next += 1
    }
    placed.push({
      node,
      x: slotX,
      y: depth,
      parentId,
      isCollapsed,
      hiddenCount: isCollapsed ? countDescendants(node) : 0,
    })
    return slotX
  }

  place(root, 0, null)
  return { placed, slots: cursor.next, maxDepth }
}

function defaultCollapsed(root: TreeNode): Set<string> {
  const ids = new Set<string>()
  function walk(node: TreeNode) {
    if (node.depth >= AUTO_COLLAPSE_DEPTH && node.children.length > 0) {
      ids.add(node.id)
      return
    }
    node.children.forEach(walk)
  }
  walk(root)
  return ids
}

export default function ChainTree({ chainId }: { chainId: string }) {
  const [tree, setTree] = useState<TreeNode | null>(null)
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('chain_acts')
      .select('*')
      .eq('chain_id', chainId)
      .then(({ data, error }) => {
        if (error) console.error('chain tree fetch error:', error)
        if (data) {
          const built = buildTree(data as ChainAct[])
          setTree(built)
          setCount(data.length)
          if (built) setCollapsed(defaultCollapsed(built))
        }
        setLoading(false)
      })
  }, [chainId])

  const { placed, slots, maxDepth } = useMemo(() => {
    if (!tree) return { placed: [] as Placed[], slots: 0, maxDepth: 0 }
    return layout(tree, collapsed)
  }, [tree, collapsed])

  function toggle(id: string) {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (loading) return <p className="text-center text-stone-400 text-sm py-16">loading the chain…</p>
  if (!tree) return <p className="text-center text-stone-400 text-sm py-16">this chain couldn't be found</p>

  const width = Math.max(slots, 1) * (NODE_W + GAP_X) - GAP_X + PAD * 2
  const height = (maxDepth + 1) * (NODE_H + GAP_Y) - GAP_Y + PAD * 2

  function px(x: number) { return PAD + x * (NODE_W + GAP_X) + NODE_W / 2 }
  function py(y: number) { return PAD + y * (NODE_H + GAP_Y) }

  const byId = new Map(placed.map((p) => [p.node.id, p]))

  return (
    <div>
      <p className="text-center font-serif text-[17px] text-[var(--ink-soft)] mb-8">
        {count} {count === 1 ? 'person has' : 'people have'} joined this chain
      </p>

      <div className="overflow-x-auto pb-6">
        <div className="relative mx-auto" style={{ width, height, minWidth: '100%' }}>
          <svg width={width} height={height} className="absolute inset-0 pointer-events-none">
            {placed.map(({ node, x, y, parentId }) => {
              if (!parentId) return null
              const parent = byId.get(parentId)
              if (!parent) return null
              const x1 = px(parent.x)
              const y1 = py(parent.y) + NODE_H
              const x2 = px(x)
              const y2 = py(y)
              const midY = (y1 + y2) / 2
              return (
                <path
                  key={node.id}
                  d={`M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`}
                  fill="none"
                  stroke="#e8cdb0"
                  strokeWidth={2}
                />
              )
            })}
          </svg>

          {placed.map(({ node, x, y, isCollapsed, hiddenCount }) => {
            const left = px(x) - NODE_W / 2
            const top = py(y)
            const hasChildren = node.children.length > 0
            return (
              <div
                key={node.id}
                className="absolute flex flex-col items-center"
                style={{ left, top, width: NODE_W }}
              >
                <button
                  onClick={() => hasChildren && toggle(node.id)}
                  className="press flex items-center gap-2 rounded-2xl px-3 py-2.5 bg-[#fffdf9] border border-[var(--line)] w-full text-left"
                  style={{ boxShadow: '0 1px 2px rgba(60,45,30,0.04)', cursor: hasChildren ? 'pointer' : 'default' }}
                >
                  <span
                    className="flex items-center justify-center rounded-full text-[11px] font-semibold text-white shrink-0"
                    style={{ width: 22, height: 22, background: 'linear-gradient(135deg, #cf7152, #b85a3e)' }}
                  >
                    {node.depth}
                  </span>
                  <span className="text-[12px] text-[var(--ink)] truncate font-serif flex-1">
                    {node.act_text}
                  </span>
                </button>
                {isCollapsed && (
                  <button
                    onClick={() => toggle(node.id)}
                    className="press mt-1.5 text-[11px] font-semibold text-[var(--accent)] bg-[#fdf0e6] border border-[#f0d5be] rounded-full px-2.5 py-0.5"
                  >
                    +{hiddenCount} more
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
