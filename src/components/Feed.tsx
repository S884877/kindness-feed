'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import MomentCard from './MomentCard'
import { Moment } from '@/lib/types'

const PAGE_SIZE = 10

async function fetchMoments(
  supabase: ReturnType<typeof createClient>,
  from: number,
  currentUserId?: string
) {
  const { data, error } = await supabase
    .from('moments')
    .select(`
      *,
      users(id, name, avatar_url),
      reactions(type, user_id)
    `)
    .order('created_at', { ascending: false })
    .range(from, from + PAGE_SIZE - 1)

  if (error || !data) return []

  return data.map((m: any) => {
    const reacts = m.reactions ?? []
    const warmth = reacts.filter((r: any) => r.type === 'warmth').length
    const heart = reacts.filter((r: any) => r.type === 'heart').length
    return {
      ...m,
      reaction_counts: { warmth, heart },
      user_reactions: {
        warmth: reacts.some((r: any) => r.type === 'warmth' && r.user_id === currentUserId),
        heart: reacts.some((r: any) => r.type === 'heart' && r.user_id === currentUserId),
      },
    } as Moment
  })
}

export default function Feed({
  initialMoments,
  currentUserId,
}: {
  initialMoments: Moment[]
  currentUserId?: string
}) {
  const [moments, setMoments] = useState<Moment[]>(initialMoments)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(initialMoments.length === PAGE_SIZE)
  const supabase = createClient()

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return
    setLoading(true)
    const next = await fetchMoments(supabase, moments.length, currentUserId)
    if (next.length < PAGE_SIZE) setHasMore(false)
    setMoments((prev) => [...prev, ...next])
    setLoading(false)
  }, [loading, hasMore, moments.length, currentUserId, supabase])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadMore() },
      { rootMargin: '200px' }
    )
    const sentinel = document.getElementById('feed-sentinel')
    if (sentinel) observer.observe(sentinel)
    return () => observer.disconnect()
  }, [loadMore])

  return (
    <div>
      <div className="flex flex-col gap-4">
        {moments.map((m) => (
          <MomentCard key={m.id} moment={m} currentUserId={currentUserId} />
        ))}
      </div>
      <div id="feed-sentinel" className="h-4 mt-4" />
      {loading && (
        <p className="text-center text-stone-400 text-sm py-4">loading more...</p>
      )}
      {!hasMore && moments.length > 0 && (
        <p className="text-center text-stone-300 text-sm py-8">
          you've reached the beginning ✦
        </p>
      )}
      {moments.length === 0 && (
        <p className="text-center text-stone-400 text-sm py-16">
          no moments yet. be the first to share one.
        </p>
      )}
    </div>
  )
}
