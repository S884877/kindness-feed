'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSession, type Session } from '@/lib/session'
import { createClient } from '@/lib/supabase/client'

type MyMoment = { id: string; kindness: string; created_at: string }

function toIndianNumber(n: number): string {
  const s = Math.round(n).toString()
  if (s.length <= 3) return s
  const last3 = s.slice(-3)
  const rest = s.slice(0, s.length - 3)
  const restFormatted = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',')
  return `${restFormatted},${last3}`
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

export default function MillionCounter({ total, goal }: { total: number; goal: number }) {
  const [barWidth, setBarWidth] = useState(0)
  const [session, setSession] = useState<Session | null>(null)
  const [myMoments, setMyMoments] = useState<MyMoment[]>([])
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const chainRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    const s = getSession()
    setSession(s)

    // animate progress bar
    const t = setTimeout(() => setBarWidth(Math.min((total / goal) * 100, 100)), 80)

    if (s) {
      const supabase = createClient()
      supabase
        .from('moments')
        .select('id, kindness, created_at')
        .eq('user_id', s.id)
        .order('created_at', { ascending: false })
        .then(({ data }) => {
          if (data && data.length > 0) {
            setMyMoments(data as MyMoment[])
            // auto-scroll if redirected back with #chain
            if (window.location.hash === '#chain') {
              setTimeout(() => {
                chainRef.current?.scrollIntoView({ behavior: 'smooth' })
              }, 150)
            }
          }
        })
    }

    return () => clearTimeout(t)
  }, [total, goal])

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

  async function passItOn(momentId: string) {
    const url = `${window.location.origin}/m/${momentId}`
    const msg = `Someone shared an act of kindness and started a chain.\nNow it's your turn. Add your own act and join the chain.\nTogether, we're building 1,000,000 acts this week. Let's go. ${url}`
    try {
      await navigator.clipboard.writeText(msg)
      setCopiedId(momentId)
      setTimeout(() => setCopiedId(null), 2000)
    } catch {}
  }

  const hasChain = session !== null && myMoments.length > 0

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

      {/* highlight bar — only when logged in + has moments */}
      {hasChain && (
        <div
          className="w-full flex items-center justify-between rounded-2xl px-5 py-4 mb-10"
          style={{
            background: '#edf2ec',
            border: '1px solid #d4e3d2',
          }}
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

      {/* chain view — only when logged in + has moments */}
      {hasChain && (
        <div ref={chainRef} id="chain" className="mt-16 pt-2">
          <p className="text-[11px] font-semibold text-[var(--ink-faint)] uppercase tracking-[0.08em] mb-5">
            your chain so far
          </p>
          <div className="flex flex-col gap-3">
            {myMoments.map((m) => (
              <div
                key={m.id}
                className="rounded-2xl px-5 py-4"
                style={{ background: '#fdf0e6', border: '1px solid #f0d5be' }}
              >
                <p className="font-serif text-[15px] leading-[1.55] text-[var(--ink)] mb-3 line-clamp-3">
                  {m.kindness}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-[11px]" style={{ color: 'var(--ink-faint)' }}>
                    {relativeTime(m.created_at)}
                  </span>
                  <button
                    onClick={() => passItOn(m.id)}
                    className="text-[12px] font-semibold transition-colors"
                    style={{ color: copiedId === m.id ? '#3d5c3a' : 'var(--accent)' }}
                  >
                    {copiedId === m.id ? 'copied ✓' : 'pass it on'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
