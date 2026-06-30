'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import MomentCard from './MomentCard'
import { Moment } from '@/lib/types'
import type { Session } from '@/lib/session'

function PlayIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5,3 19,12 5,21" />
    </svg>
  )
}

function PauseIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="4" width="4" height="16" rx="1" />
      <rect x="14" y="4" width="4" height="16" rx="1" />
    </svg>
  )
}

function useSpeechPlayer(moments: Moment[]) {
  const [playing, setPlaying] = useState(false)
  const playingRef = useRef(false)
  const indexRef = useRef(0)
  const intervalsRef = useRef<ReturnType<typeof setInterval>[]>([])

  function cleanup() {
    intervalsRef.current.forEach(clearInterval)
    intervalsRef.current = []
  }

  function speakAt(idx: number) {
    if (!playingRef.current || idx >= moments.length) {
      playingRef.current = false
      setPlaying(false)
      cleanup()
      return
    }
    indexRef.current = idx
    const m = moments[idx]
    const intro = m.location ? `someone in ${m.location}. ` : ''
    const text = `${intro}${m.kindness}. and it made them feel — ${m.feeling}.`
    const utter = new SpeechSynthesisUtterance(text)
    utter.rate = 0.88
    utter.onend = () => speakAt(idx + 1)
    utter.onerror = () => speakAt(idx + 1)
    window.speechSynthesis.speak(utter)
  }

  function startKeepAlive() {
    try {
      const Ctx = (window.AudioContext || (window as any).webkitAudioContext) as (new () => AudioContext) | undefined
      if (Ctx) {
        const ctx = new Ctx()
        // silent tick keeps iOS audio session alive when screen locks
        const tick = () => {
          const buf = ctx.createBuffer(1, 1, 22050)
          const src = ctx.createBufferSource()
          src.buffer = buf
          src.connect(ctx.destination)
          src.start(0)
        }
        intervalsRef.current.push(setInterval(tick, 5000))
      }
    } catch {}
    // Chrome stops speechSynthesis after ~15s — pause/resume resets the timer
    intervalsRef.current.push(setInterval(() => {
      if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
        window.speechSynthesis.pause()
        window.speechSynthesis.resume()
      }
    }, 10000))
  }

  function toggle() {
    if (playing) {
      playingRef.current = false
      setPlaying(false)
      window.speechSynthesis.cancel()
      cleanup()
    } else {
      playingRef.current = true
      setPlaying(true)
      startKeepAlive()
      speakAt(indexRef.current)
    }
  }

  useEffect(() => {
    indexRef.current = 0
  }, [moments])

  useEffect(() => () => {
    playingRef.current = false
    window.speechSynthesis?.cancel()
    cleanup()
  }, [])

  return { playing, toggle }
}

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
    .select(`${COLUMNS}, saved_moments(count)`)
    .order('created_at', { ascending: false })
    .range(from, from + PAGE_SIZE - 1)
  if (error) console.error('fetchMoments error:', error)
  if (error || !data) return []
  return (data as any[]).sort((a, b) => {
    const ac = a.saved_moments?.[0]?.count ?? 0
    const bc = b.saved_moments?.[0]?.count ?? 0
    return bc - ac
  }) as Moment[]
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
  const { playing, toggle } = useSpeechPlayer(moments)

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

      {/* floating listen button */}
      <button
        onClick={toggle}
        className="fixed bottom-24 right-5 z-30 flex items-center gap-2 text-white text-[13px] font-semibold px-4 py-2.5 rounded-full shadow-lg transition-all active:scale-95"
        style={{ background: playing ? '#6b5a4e' : 'linear-gradient(135deg, #cf7152, #b85a3e)', boxShadow: '0 4px 16px rgba(60,45,30,0.25)' }}
        aria-label={playing ? 'pause' : 'listen'}
      >
        {playing ? <PauseIcon /> : <PlayIcon />}
        {playing ? 'pause' : 'listen'}
      </button>
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
