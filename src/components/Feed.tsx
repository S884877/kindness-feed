'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import MomentCard from './MomentCard'
import { Moment } from '@/lib/types'
import type { Session } from '@/lib/session'

const PAGE_SIZE = 10
const NUDGE_INSERT_AFTER = 4
const COLUMNS = 'id, kindness, feeling, location, mood, image_url, created_at, posted_by, user_id'

const NUDGE_PROMPTS = [
  "someone was kind to you recently. what happened?",
  "tell us about a moment someone made your day.",
  "who showed you kindness? share their moment.",
  "a small act. a big feeling. what was yours?",
  "what kindness are you still thinking about?",
  "you've been reading for a while. something must have stayed with you.",
  "did someone do something small that meant everything? tell us.",
  "when did a stranger's kindness catch you off guard? we'd love to hear it.",
  "is there a moment of kindness you still think about? share it here.",
  "someone out there needs to hear what you experienced. share your moment.",
]

async function fetchMoments(supabase: ReturnType<typeof createClient>, from: number) {
  const { data, error } = await supabase
    .from('moments')
    .select(COLUMNS)
    .order('created_at', { ascending: false })
    .range(from, from + PAGE_SIZE - 1)
  if (error) console.error('fetchMoments error:', error)
  if (error || !data) return []
  return data as Moment[]
}

function NudgeCard({ onShare }: { onShare: () => void }) {
  const prompt = useRef(NUDGE_PROMPTS[Math.floor(Math.random() * NUDGE_PROMPTS.length)])
  return (
    <div
      className="rounded-[22px] px-7 py-6"
      style={{
        background: '#fdf0e6',
        border: '1px solid #f0d5be',
        boxShadow:
          '0 1px 2px rgba(60, 45, 30, 0.04), 0 8px 24px rgba(60, 45, 30, 0.06)',
      }}
    >
      <p className="font-serif text-[19px] leading-[1.5] text-[var(--ink)] mb-5">
        {prompt.current}
      </p>
      <button
        onClick={onShare}
        className="press text-sm font-semibold text-[var(--accent)] hover:underline"
      >
        share my moment
      </button>
    </div>
  )
}

export default function Feed({
  initialMoments,
  session,
  savedIds,
  onSaveToggle,
  onAuthRequired,
  onNudgeShare,
}: {
  initialMoments: Moment[]
  session: Session | null
  savedIds: Set<string>
  onSaveToggle: (id: string, saved: boolean) => void
  onAuthRequired: () => void
  onNudgeShare: () => void
}) {
  const [moments, setMoments] = useState<Moment[]>(initialMoments)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(initialMoments.length === PAGE_SIZE)
  const supabase = createClient()

  useEffect(() => {
    setMoments(initialMoments)
    setHasMore(initialMoments.length === PAGE_SIZE)
  }, [initialMoments])

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return
    setLoading(true)
    const next = await fetchMoments(supabase, moments.length)
    if (next.length < PAGE_SIZE) setHasMore(false)
    setMoments(prev => [...prev, ...next])
    setLoading(false)
  }, [loading, hasMore, moments.length, supabase])

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting) loadMore() },
      { rootMargin: '200px' }
    )
    const sentinel = document.getElementById('feed-sentinel')
    if (sentinel) observer.observe(sentinel)
    return () => observer.disconnect()
  }, [loadMore])

  function handleNudgeShare() {
    if (!session) { onAuthRequired(); return }
    onNudgeShare()
  }

  const cards: React.ReactNode[] = []
  moments.forEach((m, i) => {
    cards.push(
      <MomentCard
        key={m.id}
        moment={m}
        index={i}
        session={session}
        initialSaved={savedIds.has(m.id)}
        onSaveToggle={onSaveToggle}
        onAuthRequired={onAuthRequired}
      />
    )
    if (i === NUDGE_INSERT_AFTER - 1) {
      cards.push(<NudgeCard key="nudge" onShare={handleNudgeShare} />)
    }
  })

  return (
    <div>
      <div className="flex flex-col gap-5">
        {cards}
      </div>
      <div id="feed-sentinel" className="h-4 mt-4" />
      {loading && <p className="text-center text-stone-400 text-sm py-6">loading more...</p>}
      {!hasMore && moments.length > 0 && (
        <p className="text-center text-stone-300 text-sm py-10">you've reached the beginning ✦</p>
      )}
      {moments.length === 0 && (
        <p className="text-center text-stone-400 text-sm py-20">no moments yet — be the first to share one</p>
      )}
    </div>
  )
}
