'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ChainAct } from '@/lib/chain'

type TreeNode = ChainAct & { children: TreeNode[] }

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

function Node({ node, autoCollapseDepth = 3 }: { node: TreeNode; autoCollapseDepth?: number }) {
  const [collapsed, setCollapsed] = useState(node.depth >= autoCollapseDepth && node.children.length > 0)
  const hasChildren = node.children.length > 0

  return (
    <div className="flex flex-col items-start">
      <div className="flex items-center gap-2">
        <div
          className="flex items-center gap-2 rounded-2xl px-4 py-2.5 bg-[#fffdf9] border border-[var(--line)]"
          style={{ boxShadow: '0 1px 2px rgba(60,45,30,0.04)' }}
        >
          <span
            className="flex items-center justify-center rounded-full text-[11px] font-semibold text-white shrink-0"
            style={{ width: 22, height: 22, background: 'linear-gradient(135deg, #cf7152, #b85a3e)' }}
          >
            {node.depth}
          </span>
          <span className="text-[13px] text-[var(--ink)] max-w-[220px] truncate font-serif">
            {node.act_text}
          </span>
        </div>
        {hasChildren && (
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="press text-[11px] text-[var(--ink-faint)] hover:text-[var(--accent)] shrink-0"
          >
            {collapsed ? `+${node.children.length}` : '−'}
          </button>
        )}
      </div>

      {hasChildren && !collapsed && (
        <div className="flex flex-col gap-3 mt-3 ml-5 pl-5 border-l-2" style={{ borderColor: '#f0d5be' }}>
          {node.children.map((child) => (
            <Node key={child.id} node={child} autoCollapseDepth={autoCollapseDepth} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function ChainTree({ chainId }: { chainId: string }) {
  const [tree, setTree] = useState<TreeNode | null>(null)
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('chain_acts')
      .select('*')
      .eq('chain_id', chainId)
      .then(({ data, error }) => {
        if (error) console.error('chain tree fetch error:', error)
        if (data) {
          setTree(buildTree(data as ChainAct[]))
          setCount(data.length)
        }
        setLoading(false)
      })
  }, [chainId])

  if (loading) return <p className="text-center text-stone-400 text-sm py-16">loading the chain…</p>
  if (!tree) return <p className="text-center text-stone-400 text-sm py-16">this chain couldn't be found</p>

  return (
    <div>
      <p className="text-center font-serif text-[17px] text-[var(--ink-soft)] mb-8">
        {count} {count === 1 ? 'person has' : 'people have'} joined this chain
      </p>
      <div className="overflow-x-auto pb-6">
        <Node node={tree} />
      </div>
    </div>
  )
}
