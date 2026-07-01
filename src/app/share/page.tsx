'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { getSession } from '@/lib/session'
import { trackFormStarted, trackFormCompleted } from '@/lib/metrics'

const MAX_WORDS = 350

function countWords(text: string): number {
  return text.trim() === '' ? 0 : text.trim().split(/\s+/).length
}

function limitWords(text: string, max: number): string {
  const words = text.split(/(\s+)/)
  let count = 0
  let result = ''
  for (const token of words) {
    if (/\S/.test(token)) {
      if (count >= max) break
      count++
    }
    result += token
  }
  return result
}

function randomUsername() {
  const digits = Math.floor(1000 + Math.random() * 9000)
  return `kinduser_${digits}`
}

function ShareIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  )
}

export default function SharePage() {
  const [kindness, setKindness] = useState('')
  const [feeling, setFeeling] = useState('')
  const [location, setLocation] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [copied, setCopied] = useState(false)
  const [formEventId, setFormEventId] = useState<string | undefined>()
  const router = useRouter()

  useEffect(() => {
    const session = getSession()
    if (!session) { router.replace('/login'); return }
    trackFormStarted(session.id).then(setFormEventId)
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!kindness.trim() || !feeling.trim()) return
    setLoading(true)
    setError('')

    const session = getSession()
    const supabase = createClient()

    const insert: Record<string, unknown> = {
      kindness: kindness.trim(),
      feeling: feeling.trim(),
      posted_by: randomUsername(),
      location: location.trim() || null,
    }
    if (session?.id) insert.user_id = session.id

    const { error: err } = await supabase.from('moments').insert(insert)
    if (err) {
      console.error('insert error:', err)
      setError(err.message || 'something went wrong. try again.')
      setLoading(false)
      return
    }

    if (formEventId) trackFormCompleted(formEventId)
    router.refresh()
    setLoading(false)
    setSubmitted(true)
  }

  async function handlePassItOn() {
    try {
      await navigator.clipboard.writeText(window.location.origin)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {}
  }

  if (submitted) {
    return (
      <div className="feed-frame px-5 flex flex-col items-center justify-center text-center" style={{ minHeight: '55vh' }}>
        <p className="font-serif text-[24px] leading-[1.5] text-[var(--ink)] mb-2">
          your moment is on the wall. 🤍
        </p>
        <p className="font-serif text-[18px] leading-[1.6] text-[var(--ink-soft)] mb-10">
          feel free to pass it on.
        </p>

        <div className="relative">
          <button
            onClick={handlePassItOn}
            className="press flex items-center gap-2 text-white font-semibold px-6 py-3.5 rounded-full text-[15px]"
            style={{ background: 'linear-gradient(135deg, #cf7152, #b85a3e)' }}
          >
            <ShareIcon />
            pass it on
          </button>
          {copied && (
            <span
              className="absolute -top-10 left-1/2 -translate-x-1/2 bg-[var(--ink)] text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap"
              style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
            >
              link copied
            </span>
          )}
        </div>

        <Link
          href="/"
          className="mt-6 text-sm text-[var(--ink-faint)] hover:text-[var(--ink)] transition-colors"
        >
          back to the wall
        </Link>
      </div>
    )
  }

  const fieldCls = 'w-full border border-[var(--line)] rounded-2xl px-4 py-3.5 text-[var(--ink)] bg-[#fffdf9] placeholder:text-[var(--ink-faint)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40 focus:border-[var(--accent)]/40 transition text-[15px] leading-relaxed'
  const labelCls = 'block text-[11px] font-semibold text-[var(--ink-faint)] uppercase tracking-[0.08em] mb-2.5'

  return (
    <div className="feed-frame px-5">
      <p className="font-serif text-[22px] leading-[1.4] text-[var(--ink)] mb-8">
        what act of kindness did someone show you?
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div>
          <textarea
            value={kindness}
            onChange={(e) => setKindness(limitWords(e.target.value, MAX_WORDS))}
            rows={5}
            placeholder="a stranger held the door open even though i was far away..."
            required
            autoFocus
            className={`${fieldCls} resize-none font-serif`}
          />
          {(() => {
            const wc = countWords(kindness)
            return (
              <p className="text-right text-[11px] mt-1.5" style={{ color: wc >= MAX_WORDS ? 'var(--accent)' : 'rgba(168,156,143,0.7)' }}>
                {wc} / {MAX_WORDS}
              </p>
            )
          })()}
        </div>

        <div>
          <label className={labelCls}>how did it make you feel?</label>
          <textarea
            value={feeling}
            onChange={(e) => setFeeling(limitWords(e.target.value, MAX_WORDS))}
            rows={5}
            placeholder="like i wasn't invisible. like i mattered for just a moment..."
            required
            className={`${fieldCls} resize-none font-serif italic`}
          />
          {(() => {
            const wc = countWords(feeling)
            return (
              <p className="text-right text-[11px] mt-1.5" style={{ color: wc >= MAX_WORDS ? 'var(--accent)' : 'rgba(168,156,143,0.7)' }}>
                {wc} / {MAX_WORDS}
              </p>
            )
          })()}
        </div>

        <div>
          <label className={labelCls}>where from? (optional)</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            maxLength={100}
            placeholder="your city or town"
            className={fieldCls}
          />
        </div>

        {error && <p className="text-[var(--accent)] text-[13px]">{error}</p>}

        <button
          type="submit"
          disabled={loading || !kindness.trim() || !feeling.trim()}
          className="press text-white font-semibold py-3.5 rounded-2xl transition-all text-[15px] disabled:opacity-40 mt-2"
          style={{ background: 'linear-gradient(135deg, #cf7152, #b85a3e)' }}
        >
          {loading ? 'sharing...' : 'share this moment'}
        </button>
      </form>
    </div>
  )
}
