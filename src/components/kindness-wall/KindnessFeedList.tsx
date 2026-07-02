'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { KindnessWallPost } from '@/lib/kindnessWall'

const FETCH_CAP = 1000
const CHUNK_SIZE = 15

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

// Fisher-Yates — unbiased shuffle, unlike the common sort(() => Math.random() - 0.5) trick
function shuffle<T>(arr: T[]): T[] {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

export default function KindnessFeedList() {
  const [shuffled, setShuffled] = useState<KindnessWallPost[] | null>(null)
  const [visibleCount, setVisibleCount] = useState(CHUNK_SIZE)
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('kindness_wall_posts')
        .select('id, act_text, image_url, created_at')
        .order('created_at', { ascending: false })
        .limit(FETCH_CAP)
      if (error) console.error('kindness wall feed fetch error:', error)
      if (cancelled) return
      setShuffled(shuffle((data ?? []) as KindnessWallPost[]))
    }
    load()
    return () => { cancelled = true }
  }, [])

  const revealMore = useCallback(() => {
    setVisibleCount((n) => (shuffled ? Math.min(shuffled.length, n + CHUNK_SIZE) : n))
  }, [shuffled])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) revealMore() },
      { rootMargin: '400px' }
    )
    const el = sentinelRef.current
    if (el) observer.observe(el)
    return () => observer.disconnect()
  }, [revealMore])

  if (shuffled === null) return null

  if (shuffled.length === 0) {
    return <p className="kw-body text-[14px]">no acts of kindness yet — be the first to share one.</p>
  }

  const visible = shuffled.slice(0, visibleCount)

  return (
    <div className="flex flex-col gap-10">
      {visible.map((post) => (
        <div key={post.id}>
          {post.image_url && (
            <img
              src={post.image_url}
              alt=""
              className="w-full mb-4"
              style={{ maxHeight: 420, objectFit: 'cover' }}
            />
          )}
          <p className="text-[17px] leading-[1.7]" style={{ color: 'var(--kw-text)' }}>
            {post.act_text}
          </p>
          <p className="kw-body text-[12px] mt-2">{relativeTime(post.created_at)}</p>
        </div>
      ))}
      {visibleCount < shuffled.length && <div ref={sentinelRef} className="h-4" />}
    </div>
  )
}
