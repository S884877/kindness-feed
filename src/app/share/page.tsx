'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getSession } from '@/lib/session'

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

export default function SharePage() {
  const [kindness, setKindness] = useState('')
  const [feeling, setFeeling] = useState('')
  const [location, setLocation] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    const session = getSession()
    if (!session) router.replace('/login')
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

    router.refresh()
    router.push('/')
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
