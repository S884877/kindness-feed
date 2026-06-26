'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Session } from '@/lib/session'

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

export default function PostModal({
  session,
  externalTrigger = 0,
  onAuthRequired,
}: {
  session: Session | null
  externalTrigger?: number
  onAuthRequired?: () => void
}) {
  const [open, setOpen] = useState(false)
  const [kindness, setKindness] = useState('')
  const [feeling, setFeeling] = useState('')
  const [location, setLocation] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    if (externalTrigger > 0) setOpen(true)
  }, [externalTrigger])

  function closeModal() {
    if (loading) return
    setOpen(false)
    setKindness('')
    setFeeling('')
    setLocation('')
    setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!kindness.trim() || !feeling.trim()) return
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error: err } = await supabase.from('moments').insert({
      kindness: kindness.trim(),
      feeling: feeling.trim(),
      posted_by: randomUsername(),
      location: location.trim() || null,
      user_id: session?.id ?? null,
    })
    if (err) {
      setError('something went wrong. try again.')
      setLoading(false)
      return
    }
    setLoading(false)
    closeModal()
    router.refresh()
  }

  const labelCls = 'block text-[11px] font-semibold text-[var(--ink-faint)] uppercase tracking-[0.08em] mb-2.5'
  const fieldCls =
    'w-full border border-[var(--line)] rounded-2xl px-4 py-3.5 text-[var(--ink)] bg-[#fffdf9] placeholder:text-[var(--ink-faint)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40 focus:border-[var(--accent)]/40 transition text-[15px] leading-relaxed'

  return (
    <>
      <button
        onClick={() => { if (!session) { onAuthRequired?.(); return } setOpen(true) }}
        className="press fixed bottom-20 right-6 z-30 text-white font-semibold text-sm px-6 py-4 rounded-full flex items-center gap-2"
        style={{
          background: 'linear-gradient(135deg, #cf7152, #b85a3e)',
          boxShadow: '0 8px 24px -6px rgba(184, 90, 62, 0.55), 0 2px 6px rgba(0,0,0,0.08)',
        }}
      >
        <span className="text-base leading-none">✦</span>
        share a moment
      </button>

      {open && (
        <div
          className="backdrop-in fixed inset-0 z-40 bg-[#2c2620]/35 backdrop-blur-md flex items-center justify-center px-4 py-8 overflow-y-auto"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal() }}
        >
          <div
            className="sheet-in bg-[#fffdf9] rounded-[28px] w-full max-w-lg p-7 my-auto"
            style={{ boxShadow: '0 30px 80px -20px rgba(60,45,30,0.4), 0 8px 24px rgba(60,45,30,0.12)' }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-2xl text-[var(--ink)]">share a moment</h2>
              <button
                onClick={closeModal}
                className="press text-[var(--ink-faint)] hover:text-[var(--ink)] transition-colors text-2xl leading-none w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#f3ece2]"
                aria-label="close"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div>
                <label className={labelCls}>what act of kindness did someone show you?</label>
                <textarea
                  value={kindness}
                  onChange={(e) => setKindness(limitWords(e.target.value, MAX_WORDS))}
                  rows={3}
                  placeholder="a stranger held the door open even though i was far away..."
                  required
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
                  rows={3}
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

              {error && <p className="text-[var(--accent)] text-sm">{error}</p>}

              <button
                type="submit"
                disabled={loading || !kindness.trim() || !feeling.trim()}
                className="press text-white font-semibold py-3.5 rounded-2xl transition-all text-[15px] disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg, #cf7152, #b85a3e)' }}
              >
                {loading ? 'posting...' : 'post your moment'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
