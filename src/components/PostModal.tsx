'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const MAX = 280

function randomUsername() {
  const digits = Math.floor(1000 + Math.random() * 9000)
  return `kinduser_${digits}`
}

export default function PostModal() {
  const [open, setOpen] = useState(false)
  const [kindness, setKindness] = useState('')
  const [feeling, setFeeling] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  function openModal() { setOpen(true) }
  function closeModal() {
    if (loading) return
    setOpen(false)
    setKindness('')
    setFeeling('')
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

  return (
    <>
      {/* Floating button */}
      <button
        onClick={openModal}
        className="fixed bottom-6 right-6 z-30 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-semibold text-sm px-5 py-3.5 rounded-full shadow-lg transition-colors flex items-center gap-2"
      >
        <span className="text-base leading-none">✦</span>
        share a moment
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm flex items-center justify-center px-4"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal() }}
        >
          {/* Modal */}
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-stone-900">share a moment</h2>
              <button
                onClick={closeModal}
                className="text-stone-400 hover:text-stone-600 transition-colors text-xl leading-none"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div>
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">
                  what did someone do for you?
                </label>
                <textarea
                  value={kindness}
                  onChange={(e) => setKindness(e.target.value)}
                  maxLength={MAX}
                  rows={3}
                  placeholder="a stranger held the door open even though i was far away..."
                  required
                  className="w-full border border-stone-200 rounded-xl px-4 py-3 text-stone-900 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none text-sm leading-relaxed"
                />
                <p className="text-right text-xs text-stone-300 mt-1">{kindness.length}/{MAX}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">
                  how did it make you feel?
                </label>
                <textarea
                  value={feeling}
                  onChange={(e) => setFeeling(e.target.value)}
                  maxLength={MAX}
                  rows={3}
                  placeholder="like i wasn't invisible. like i mattered for just a moment..."
                  required
                  className="w-full border border-stone-200 rounded-xl px-4 py-3 text-stone-900 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none text-sm leading-relaxed"
                />
                <p className="text-right text-xs text-stone-300 mt-1">{feeling.length}/{MAX}</p>
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <button
                type="submit"
                disabled={loading || !kindness.trim() || !feeling.trim()}
                className="bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
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
