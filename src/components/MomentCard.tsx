'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Moment } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString()
}

export default function MomentCard({
  moment,
  currentUserId,
}: {
  moment: Moment
  currentUserId?: string
}) {
  const [counts, setCounts] = useState(
    moment.reaction_counts ?? { warmth: 0, heart: 0 }
  )
  const [userReactions, setUserReactions] = useState(
    moment.user_reactions ?? { warmth: false, heart: false }
  )
  const [loading, setLoading] = useState(false)

  async function toggleReaction(type: 'warmth' | 'heart') {
    if (!currentUserId || loading) return
    setLoading(true)
    const supabase = createClient()
    const active = userReactions[type]
    if (active) {
      await supabase
        .from('reactions')
        .delete()
        .eq('moment_id', moment.id)
        .eq('user_id', currentUserId)
        .eq('type', type)
      setCounts((c) => ({ ...c, [type]: c[type] - 1 }))
      setUserReactions((r) => ({ ...r, [type]: false }))
    } else {
      await supabase
        .from('reactions')
        .insert({ moment_id: moment.id, user_id: currentUserId, type })
      setCounts((c) => ({ ...c, [type]: c[type] + 1 }))
      setUserReactions((r) => ({ ...r, [type]: true }))
    }
    setLoading(false)
  }

  const displayName = moment.users?.name ?? 'anonymous'

  return (
    <article className="bg-white border border-stone-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
      <Link href={`/m/${moment.id}`} className="block group">
        <p className="text-stone-800 text-base leading-relaxed mb-3">
          {moment.kindness}
        </p>
        <p className="text-stone-500 text-sm leading-relaxed">
          {moment.feeling}
        </p>
      </Link>

      <div className="mt-4 flex items-center justify-between text-xs text-stone-400">
        <span>{displayName} · {timeAgo(moment.created_at)}</span>
        <div className="flex gap-3">
          <button
            onClick={() => toggleReaction('warmth')}
            className={`flex items-center gap-1 transition-colors ${
              userReactions.warmth
                ? 'text-amber-500'
                : 'hover:text-amber-400'
            } ${!currentUserId ? 'cursor-default' : 'cursor-pointer'}`}
            title="Warmth"
          >
            <span>☀️</span>
            <span>{counts.warmth || ''}</span>
          </button>
          <button
            onClick={() => toggleReaction('heart')}
            className={`flex items-center gap-1 transition-colors ${
              userReactions.heart
                ? 'text-rose-500'
                : 'hover:text-rose-400'
            } ${!currentUserId ? 'cursor-default' : 'cursor-pointer'}`}
            title="Heart"
          >
            <span>♡</span>
            <span>{counts.heart || ''}</span>
          </button>
        </div>
      </div>
    </article>
  )
}
