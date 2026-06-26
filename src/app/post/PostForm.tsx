'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const MAX = 280

export default function PostForm({ userId }: { userId: string }) {
  const [kindness, setKindness] = useState('')
  const [feeling, setFeeling] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!kindness.trim() || !feeling.trim()) return
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error: err } = await supabase.from('moments').insert({
      user_id: userId,
      kindness: kindness.trim(),
      feeling: feeling.trim(),
    })
    if (err) {
      setError('something went wrong, try again')
      setLoading(false)
      return
    }
    router.push('/')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div>
        <label className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-2">
          what did someone do for you?
        </label>
        <textarea
          value={kindness}
          onChange={(e) => setKindness(e.target.value)}
          maxLength={MAX}
          rows={3}
          placeholder="A stranger held the door open even though I was far away..."
          required
          className="w-full border border-stone-200 rounded-xl px-4 py-3 text-stone-800 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-300 resize-none text-sm"
        />
        <p className="text-right text-xs text-stone-300 mt-1">{kindness.length}/{MAX}</p>
      </div>

      <div>
        <label className="block text-xs font-medium text-stone-500 uppercase tracking-wide mb-2">
          how did it make you feel?
        </label>
        <textarea
          value={feeling}
          onChange={(e) => setFeeling(e.target.value)}
          maxLength={MAX}
          rows={3}
          placeholder="Like I wasn't invisible. Like I mattered for just a moment..."
          required
          className="w-full border border-stone-200 rounded-xl px-4 py-3 text-stone-800 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-300 resize-none text-sm"
        />
        <p className="text-right text-xs text-stone-300 mt-1">{feeling.length}/{MAX}</p>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={loading || !kindness.trim() || !feeling.trim()}
        className="bg-stone-800 text-white py-3 rounded-xl hover:bg-stone-700 transition-colors disabled:opacity-40 text-sm font-medium"
      >
        {loading ? 'sharing...' : 'share this moment'}
      </button>
    </form>
  )
}
