'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import MomentCard from './MomentCard'
import { Moment } from '@/lib/types'

const PAGE_SIZE = 10

const COLUMNS = 'id, kindness, feeling, location, first_name, mood, me_too_count, created_at'

async function fetchMoments(supabase: ReturnType<typeof createClient>, from: number) {
  const { data, error } = await supabase
    .from('moments')
    .select(COLUMNS)
    .order('created_at', { ascending: false })
    .range(from, from + PAGE_SIZE - 1)

  if (error || !data) return []
  return data as Moment[]
}

export default function Feed({ initialMoments }: { initialMoments: Moment[] }) {
  const [moments, setMoments] = useState<Moment[]>(initialMoments)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(initialMoments.length === PAGE_SIZE)
  const supabase = createClient()

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return
    setLoading(true)
    const next = await fetchMoments(supabase, moments.length)
    if (next.length < PAGE_SIZE) setHasMore(false)
    setMoments((prev) => [...prev, ...next])
    setLoading(false)
  }, [loading, hasMore, moments.length, supabase])

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
      <div className="flex flex-col gap-5">
        {moments.map((m, i) => (
          <MomentCard key={m.id} moment={m} index={i} />
        ))}
      </div>
      <div id="feed-sentinel" className="h-4 mt-4" />
      {loading && (
        <p className="text-center text-stone-400 text-sm py-6">loading more...</p>
      )}
      {!hasMore && moments.length > 0 && (
        <p className="text-center text-stone-300 text-sm py-10">
          you've reached the beginning ✦
        </p>
      )}
      {moments.length === 0 && (
        <p className="text-center text-stone-400 text-sm py-20">
          no moments yet — be the first to share one
        </p>
      )}
    </div>
  )
}
