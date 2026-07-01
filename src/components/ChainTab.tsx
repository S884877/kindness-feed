'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getSession, type Session } from '@/lib/session'
import type { ChainAct } from '@/lib/chain'
import ChainForm from './ChainForm'

type ChainState = 'A' | 'B' | 'C'

const WINDOW = 5

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days}d ago`
  return `${Math.floor(days / 7)}w ago`
}

export default function ChainTab({ initialRef }: { initialRef?: string }) {
  const [session, setSession] = useState<Session | null>(null)
  // paint the chain immediately as the global chain — swapped out once we
  // know whether the visitor is arriving via an invite link or has their own
  // chain, so the visualization never waits on an auth check.
  const [chainState, setChainState] = useState<ChainState>('A')
  const [acts, setActs] = useState<ChainAct[]>([])
  const [expandAbove, setExpandAbove] = useState(false)
  const [expandBelow, setExpandBelow] = useState(false)
  const [showAuthSheet, setShowAuthSheet] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [parentActToken, setParentActToken] = useState<string | undefined>(undefined)
  const [inviteCopied, setInviteCopied] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const s = getSession()
    setSession(s)
    load(s)
  }, [])

  async function load(s: Session | null) {
    const supabase = createClient()

    if (initialRef) localStorage.setItem('chain_ref', initialRef)
    const storedRef = initialRef || localStorage.getItem('chain_ref')

    if (storedRef) {
      // State B — show the inviter's chain. storedRef may be a share_token
      // (arrived via a card's share link) or a user_id (arrived via /join).
      const { data: byToken } = await supabase
        .from('chain_acts')
        .select('chain_id, share_token')
        .eq('share_token', storedRef)
        .maybeSingle()

      let inviterChainId = byToken?.chain_id ?? null
      let inviterShareToken = byToken?.share_token ?? null

      if (!inviterChainId) {
        const { data: byUser } = await supabase
          .from('chain_acts')
          .select('chain_id, share_token')
          .eq('user_id', storedRef)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        inviterChainId = byUser?.chain_id ?? null
        inviterShareToken = byUser?.share_token ?? null
      }

      if (inviterChainId) {
        const { data: chain } = await supabase
          .from('chain_acts')
          .select('*')
          .eq('chain_id', inviterChainId)
          .order('depth', { ascending: true })
        setActs((chain ?? []) as ChainAct[])
        setParentActToken(inviterShareToken ?? undefined)
        setChainState('B')
        return
      }
    }

    if (s) {
      // State C — user's own chain
      const { data: myAct } = await supabase
        .from('chain_acts')
        .select('chain_id')
        .eq('user_id', s.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (myAct?.chain_id) {
        const { data: chain } = await supabase
          .from('chain_acts')
          .select('*')
          .eq('chain_id', myAct.chain_id)
          .order('depth', { ascending: true })
        setActs((chain ?? []) as ChainAct[])
        setChainState('C')
        return
      }
    }

    // State A — global chain (most recent 30, oldest first)
    const { data: global } = await supabase
      .from('chain_acts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(30)
    setActs(((global ?? []) as ChainAct[]).reverse())
    setChainState('A')
  }

  function handleAddOrJoin() {
    if (!session) { setShowAuthSheet(true); return }
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    load(session)
  }

  async function handleInvite() {
    if (!session) return
    const myAct = acts.find(a => a.user_id === session.id)
    const shareUrl = myAct
      ? `${window.location.origin}/?ref=${myAct.share_token}`
      : `${window.location.origin}/join?ref=${session.id}`
    const msg = `Someone shared an act of kindness and started a chain.\nNow it's your turn. Share something kind that you did and join the chain.\nTogether, we're building 1,000,000 acts this week. Let's go. ${shareUrl}`
    try {
      await navigator.clipboard.writeText(msg)
      setInviteCopied(true)
      setTimeout(() => setInviteCopied(false), 2500)
    } catch {}
  }

  const userIdx = chainState === 'C' && session
    ? acts.findIndex(a => a.user_id === session.id)
    : -1

  let displayActs = acts
  let hasHiddenAbove = false
  let hasHiddenBelow = false

  if (chainState === 'C' && userIdx >= 0) {
    const start = expandAbove ? 0 : Math.max(0, userIdx - WINDOW)
    const end = expandBelow ? acts.length : Math.min(acts.length, userIdx + WINDOW + 1)
    hasHiddenAbove = start > 0
    hasHiddenBelow = end < acts.length
    displayActs = acts.slice(start, end)
  }

  const buttonLabel =
    chainState === 'A' ? 'add to the chain' :
    chainState === 'B' ? 'join this chain' :
    inviteCopied ? 'link copied!' : 'invite others to this chain'

  return (
    <div className="pb-36">
      <p className="text-[11px] font-semibold text-[var(--ink-faint)] uppercase tracking-[0.08em] mb-6">
        your chain
      </p>

      {hasHiddenAbove && (
        <button
          onClick={() => setExpandAbove(true)}
          className="w-full text-center text-[12px] font-semibold mb-4"
          style={{ color: 'var(--accent)' }}
        >
          view more ↑
        </button>
      )}

      <div>
        {displayActs.map((a) => {
          const isUser = chainState === 'C' && !!session && a.user_id === session.id
          const dotSize = isUser ? 16 : 12

          return (
            <div key={a.id} className="flex gap-3">
              {/* line + dot */}
              <div className="flex flex-col items-center" style={{ width: 16, flexShrink: 0 }}>
                <div
                  className="relative"
                  style={{ width: dotSize, height: dotSize, marginTop: 15, flexShrink: 0 }}
                >
                  {isUser && (
                    <div
                      className="absolute inset-0 rounded-full animate-ping"
                      style={{ background: 'rgba(194,103,76,0.45)' }}
                    />
                  )}
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: isUser ? 'var(--accent)' : 'rgba(194,103,76,0.4)',
                      boxShadow: isUser ? '0 0 0 3px rgba(194,103,76,0.2)' : 'none',
                    }}
                  />
                </div>
                <div style={{
                  width: 2, flexGrow: 1, minHeight: 20, marginTop: 3,
                  background: 'rgba(194,103,76,0.22)', borderRadius: 1,
                }} />
              </div>

              {/* card */}
              <div className="flex-1" style={{ marginBottom: 20 }}>
                <div
                  className="relative"
                  style={{
                    background: isUser ? '#fdf0e6' : '#fffdf9',
                    borderRadius: 22,
                    boxShadow:
                      '0 1px 2px rgba(60,45,30,0.04), 0 8px 24px rgba(60,45,30,0.06), 0 24px 48px -24px rgba(60,45,30,0.10)',
                    padding: '16px 20px',
                  }}
                >
                  {isUser && (
                    <span
                      className="absolute top-3 right-3 text-[9px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: '#2c2620', color: '#fffdf9' }}
                    >
                      you are here
                    </span>
                  )}
                  <p
                    className="font-serif text-[15px] leading-[1.6] text-[var(--ink)] mb-2"
                    style={isUser ? { paddingRight: '72px' } : {}}
                  >
                    {a.act_text}
                  </p>
                  <p className="text-[12px]" style={{ color: 'var(--ink-faint)' }}>
                    {relativeTime(a.created_at)}
                    {a.location_text && <span> · {a.location_text}</span>}
                  </p>
                </div>
              </div>
            </div>
          )
        })}

        {/* terminal open dot — the next open slot in the chain */}
        <div className="flex gap-3 items-start">
          <div className="flex flex-col items-center" style={{ width: 16, flexShrink: 0 }}>
            <div
              className="rounded-full"
              style={{
                width: 10, height: 10, marginTop: 15,
                border: '2px solid rgba(194,103,76,0.35)',
                flexShrink: 0,
              }}
            />
          </div>
          <div className="flex-1" />
        </div>
      </div>

      {hasHiddenBelow && (
        <button
          onClick={() => setExpandBelow(true)}
          className="w-full text-center text-[12px] font-semibold mt-4"
          style={{ color: 'var(--accent)' }}
        >
          view more ↓
        </button>
      )}

      {/* fixed bottom action button */}
      <div className="fixed left-0 right-0 px-5 z-10" style={{ bottom: '76px' }}>
        <button
          onClick={chainState === 'C' ? handleInvite : handleAddOrJoin}
          className="press text-white font-semibold py-4 rounded-full text-[15px] w-full active:scale-95 transition-transform"
          style={{
            background: inviteCopied
              ? 'linear-gradient(135deg, #3d7a43, #2f6135)'
              : 'linear-gradient(135deg, #cf7152, #b85a3e)',
            boxShadow: '0 4px 20px -4px rgba(184,90,62,0.45)',
            transition: 'background 0.3s',
          }}
        >
          {buttonLabel}
        </button>
      </div>

      {/* auth bottom sheet */}
      {showAuthSheet && (
        <div
          className="fixed inset-0 z-50 flex items-end"
          style={{
            background: 'rgba(44,38,32,0.3)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
          }}
          onClick={() => setShowAuthSheet(false)}
        >
          <div
            className="w-full bg-[#fffdf9] rounded-t-3xl px-6 pt-6 pb-10 text-center"
            style={{ boxShadow: '0 -8px 32px rgba(60,45,30,0.12)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="mx-auto mb-6 rounded-full" style={{ width: 40, height: 4, background: '#e8d8c8' }} />
            <p className="font-serif text-[22px] text-[var(--ink)] mb-3">join the chain</p>
            <p className="text-[14px] leading-[1.65] text-[var(--ink-faint)] mb-8 max-w-xs mx-auto">
              sign in or create an account to add your kind act and keep this going.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => router.push('/login?next=' + encodeURIComponent('/wall?tab=chain'))}
                className="press text-white font-semibold py-3.5 rounded-full text-[15px]"
                style={{ background: 'linear-gradient(135deg, #cf7152, #b85a3e)' }}
              >
                sign in
              </button>
              <button
                onClick={() => router.push('/signup?next=' + encodeURIComponent('/wall?tab=chain'))}
                className="press font-semibold py-3.5 rounded-full text-[15px] border"
                style={{ color: 'var(--accent)', borderColor: 'rgba(194,103,76,0.3)' }}
              >
                create account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* add / join chain form sheet */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-end"
          style={{
            background: 'rgba(44,38,32,0.3)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
          }}
          onClick={closeForm}
        >
          <div
            className="relative w-full bg-[#fffdf9] rounded-t-3xl px-6 pt-6 pb-10 max-h-[85vh] overflow-y-auto"
            style={{ boxShadow: '0 -8px 32px rgba(60,45,30,0.12)' }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={closeForm}
              aria-label="close"
              className="absolute top-5 right-6 text-[var(--ink-faint)] text-xl leading-none"
            >
              ×
            </button>
            <div className="mx-auto mb-6 rounded-full" style={{ width: 40, height: 4, background: '#e8d8c8' }} />
            <ChainForm parentToken={chainState === 'B' ? parentActToken : undefined} />
          </div>
        </div>
      )}
    </div>
  )
}
