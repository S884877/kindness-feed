'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSession, type Session } from '@/lib/session'
import { createClient } from '@/lib/supabase/client'

type ChainMoment = {
  id: string
  kindness: string
  created_at: string
  location: string | null
  chain_id: string | null
  parent_moment_id: string | null
  user_id: string | null
}

function toIndianNumber(n: number): string {
  const s = Math.round(n).toString()
  if (s.length <= 3) return s
  const last3 = s.slice(-3)
  const rest = s.slice(0, s.length - 3)
  return rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + last3
}

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

function numberToWords(n: number): string {
  const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
    'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty']
  const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety']
  if (n <= 20) return ones[n]
  const t = Math.floor(n / 10), o = n % 10
  return o === 0 ? tens[t] : `${tens[t]}-${ones[o]}`
}

function encouragingLine(count: number): string {
  if (count === 0) return "your chain hasn't started yet. share your link and light it up."
  if (count <= 5) return 'something you started is beginning to move.'
  if (count <= 100) return `something you did is still moving. ${numberToWords(count)} people chose to keep it going.`
  return 'you started something that took on a life of its own.'
}

function calcDepth(moments: ChainMoment[], momentId: string, visited = new Set<string>()): number {
  if (visited.has(momentId)) return 0
  visited.add(momentId)
  const children = moments.filter(m => m.parent_moment_id === momentId)
  if (children.length === 0) return 0
  return 1 + Math.max(...children.map(c => calcDepth(moments, c.id, visited)))
}

export default function MillionCounter({ total, goal }: { total: number; goal: number }) {
  const [barWidth, setBarWidth] = useState(0)
  const [session, setSession] = useState<Session | null>(null)
  const [myMoments, setMyMoments] = useState<ChainMoment[]>([])
  const [chainMoments, setChainMoments] = useState<ChainMoment[]>([])
  const [dataLoaded, setDataLoaded] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)
  const chainRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    const s = getSession()
    setSession(s)

    const t = setTimeout(() => setBarWidth(Math.min((total / goal) * 100, 100)), 80)

    if (s) {
      const supabase = createClient()
      supabase
        .from('moments')
        .select('id, kindness, created_at, location, chain_id, parent_moment_id, user_id')
        .eq('user_id', s.id)
        .order('created_at', { ascending: false })
        .then(async ({ data }) => {
          const mine = (data ?? []) as ChainMoment[]
          setMyMoments(mine)

          const chainId = mine.find(m => m.chain_id)?.chain_id
          if (chainId) {
            const { data: chain } = await supabase
              .from('moments')
              .select('id, kindness, created_at, location, chain_id, parent_moment_id, user_id')
              .eq('chain_id', chainId)
              .order('created_at', { ascending: true })
            setChainMoments((chain ?? []) as ChainMoment[])
          }

          setDataLoaded(true)

          if (window.location.hash === '#chain') {
            setTimeout(() => chainRef.current?.scrollIntoView({ behavior: 'smooth' }), 200)
          }
        })
    } else {
      setDataLoaded(true)
    }

    return () => clearTimeout(t)
  }, [total, goal])

  const hasMyMoments = myMoments.length > 0
  const actsFromLink = chainMoments.filter(m => m.user_id !== session?.id).length

  const myRootMoment = [...myMoments]
    .filter(m => m.chain_id)
    .sort((a, b) => a.created_at.localeCompare(b.created_at))[0]
  const depth = myRootMoment ? calcDepth(chainMoments, myRootMoment.id) : 0

  const inviteUrl = session
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/join?ref=${session.id}`
    : ''
  const inviteMsg = `Someone shared an act of kindness and started a chain.\nNow it's your turn. Add your own act and join the chain.\nTogether, we're building 1,000,000 acts this week. Let's go. ${inviteUrl}`

  async function shareLink() {
    try {
      await navigator.clipboard.writeText(inviteMsg)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    } catch {}
  }

  function scrollToChain() {
    chainRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  function handleStartChain() {
    if (getSession()) {
      router.push('/share')
    } else {
      router.push('/login?next=' + encodeURIComponent('/onemillionkind#chain'))
    }
  }

  return (
    <div className="px-5 py-6">
      <h1 className="font-serif text-[30px] leading-tight text-[var(--ink)] mb-10 tracking-tight">
        theonemillionkind
      </h1>

      {/* counter + progress bar */}
      <div className="mb-10">
        <p className="text-[12px] font-medium text-[var(--ink-faint)] uppercase tracking-[0.08em] mb-3">
          acts of kindness this week
        </p>
        <p className="font-serif text-[36px] leading-none text-[var(--ink)] mb-1">
          {toIndianNumber(total)}
          <span className="text-[22px] text-[var(--ink-faint)] ml-2">/ {toIndianNumber(goal)}</span>
        </p>
        <p className="text-[12px] text-[var(--ink-faint)] mb-5">
          {((total / goal) * 100).toFixed(2)}% of the goal
        </p>
        <div className="h-2.5 w-full rounded-full overflow-hidden" style={{ background: '#e4d8cc' }}>
          <div
            className="h-full rounded-full"
            style={{
              width: `${barWidth}%`,
              background: 'linear-gradient(90deg, #cf7152, #c2674c)',
              transition: 'width 1.2s cubic-bezier(0.22, 1, 0.36, 1)',
            }}
          />
        </div>
      </div>

      {/* highlight bar — logged in + has moments (only after data loads) */}
      {dataLoaded && session && hasMyMoments && (
        <div
          className="w-full flex items-center justify-between rounded-2xl px-5 py-4 mb-10"
          style={{ background: '#edf2ec', border: '1px solid #d4e3d2' }}
        >
          <span className="font-serif text-[15px] leading-snug" style={{ color: '#3d5c3a' }}>
            your chain is growing ✦
          </span>
          <button
            onClick={scrollToChain}
            className="text-[14px] font-semibold underline underline-offset-2 shrink-0 ml-4"
            style={{ color: 'var(--accent)' }}
          >
            see it →
          </button>
        </div>
      )}

      {/* tagline */}
      <p className="font-serif text-[19px] leading-[1.6] text-[var(--ink-soft)] mb-10">
        pay it forward, one kind act at a time.
      </p>

      {/* mission block */}
      <div className="font-serif text-[17px] leading-[1.75] text-[var(--ink)] mb-12 flex flex-col gap-5">
        <p>post an act of kindness. get a link. share it with your friends.</p>
        <p>
          whoever joins through your link becomes part of your chain, and their link starts a new branch.
          1,000,000 acts a week, one chain at a time.
        </p>
        <p>together, let's make the world a little kinder than we found it. let's go.</p>
      </div>

      <button
        onClick={handleStartChain}
        className="press text-white font-semibold px-8 py-4 rounded-full text-[15px] active:scale-95 transition-transform"
        style={{
          background: 'linear-gradient(135deg, #cf7152, #b85a3e)',
          boxShadow: '0 4px 20px -4px rgba(184,90,62,0.5)',
        }}
      >
        start a chain
      </button>

      {/* chain view — only for logged-in users */}
      {dataLoaded && session && (
        <div ref={chainRef} id="chain" className="mt-16 pt-2">

          {/* section header */}
          <div className="flex items-center justify-between mb-7">
            <p className="text-[11px] font-semibold text-[var(--ink-faint)] uppercase tracking-[0.08em]">
              your chain so far
            </p>
            <div className="relative">
              <button
                onClick={shareLink}
                className="text-[13px] font-semibold"
                style={{ color: 'var(--accent)' }}
              >
                share your link ↗
              </button>
              {linkCopied && (
                <span
                  className="absolute -top-9 right-0 text-white text-[11px] px-3 py-1.5 rounded-lg whitespace-nowrap"
                  style={{ background: 'var(--ink)', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
                >
                  link copied
                </span>
              )}
            </div>
          </div>

          {/* counter card */}
          <div
            className="rounded-2xl px-6 py-7 mb-8"
            style={{ background: '#2C2018' }}
          >
            <p className="text-[10px] font-semibold tracking-[0.12em] uppercase mb-5" style={{ color: '#8a7060' }}>
              kind acts started from your link
            </p>
            <p className="font-serif text-[56px] leading-none font-bold text-white mb-2">
              {actsFromLink}
            </p>
            <p className="text-[13px] mb-6" style={{ color: '#c8a87e' }}>
              across {depth} round{depth !== 1 ? 's' : ''} of the chain
            </p>
            <div className="h-px mb-6" style={{ background: 'rgba(255,255,255,0.08)' }} />
            <p className="font-serif italic text-[15px] leading-[1.65]" style={{ color: '#c8a87e' }}>
              {encouragingLine(actsFromLink)}
            </p>
          </div>

          {/* empty state */}
          {chainMoments.length === 0 && (
            <div
              className="rounded-2xl px-5 py-7 text-center"
              style={{ border: '1.5px dashed #d4b89a' }}
            >
              <p className="font-serif text-[16px] leading-[1.65] text-[var(--ink-soft)]">
                your chain starts with your first share. pass it on.
              </p>
              <button
                onClick={shareLink}
                className="mt-4 text-[13px] font-semibold underline underline-offset-2"
                style={{ color: 'var(--accent)' }}
              >
                share your link ↗
              </button>
            </div>
          )}

          {/* chain cards with vertical line */}
          {chainMoments.length > 0 && (
            <div>
              {chainMoments.map((m, i) => {
                const isLast = i === chainMoments.length - 1
                const isMe = m.user_id === session.id
                return (
                  <div key={m.id} className="flex gap-3">
                    {/* dot + line */}
                    <div className="flex flex-col items-center" style={{ width: 14, flexShrink: 0 }}>
                      <div
                        className="rounded-full"
                        style={{
                          width: 10,
                          height: 10,
                          marginTop: 15,
                          flexShrink: 0,
                          background: isMe ? 'var(--accent)' : 'rgba(194,103,76,0.4)',
                          boxShadow: isMe ? '0 0 0 3px rgba(194,103,76,0.15)' : 'none',
                        }}
                      />
                      {!isLast && (
                        <div
                          style={{
                            width: 2,
                            flexGrow: 1,
                            minHeight: 16,
                            marginTop: 3,
                            background: 'rgba(194,103,76,0.22)',
                            borderRadius: 1,
                          }}
                        />
                      )}
                    </div>

                    {/* card */}
                    <div className="flex-1 mb-3">
                      <div
                        className="rounded-2xl px-4 py-4"
                        style={{
                          background: isMe ? '#fdf0e6' : '#faf6f1',
                          border: `1px solid ${isMe ? '#f0d5be' : '#ede3d8'}`,
                        }}
                      >
                        <p className="font-serif text-[14px] leading-[1.6] text-[var(--ink)] mb-2.5 line-clamp-3">
                          {m.kindness}
                        </p>
                        <p className="text-[11px]" style={{ color: 'var(--ink-faint)' }}>
                          {relativeTime(m.created_at)}
                          {m.location && <span> · {m.location}</span>}
                          {isMe && (
                            <span className="ml-2 font-medium" style={{ color: 'rgba(194,103,76,0.7)' }}>you</span>
                          )}
                        </p>

                        {/* add another act — inside the last card */}
                        {isLast && (
                          <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${isMe ? '#f0d5be' : '#ede3d8'}` }}>
                            <button
                              onClick={() => router.push('/share')}
                              className="text-[13px] font-semibold"
                              style={{ color: 'var(--accent)' }}
                            >
                              add another act →
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}

              {/* terminal open dot */}
              <div className="flex gap-3 items-center pl-[2px]">
                <div
                  className="rounded-full"
                  style={{
                    width: 10,
                    height: 10,
                    border: '2px solid rgba(194,103,76,0.3)',
                    flexShrink: 0,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
