'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import Feed from './Feed'
import PostModal from './PostModal'
import BottomNav from './BottomNav'
import MomentCard from './MomentCard'
import { Moment } from '@/lib/types'
import type { User } from '@supabase/supabase-js'

type View = 'mine' | 'wall' | 'kept'

const NUDGE_PROMPTS = [
  "what's an act of kindness from someone that stayed with you? share the moment",
  "did someone do something small that meant everything? tell us",
  "when did a stranger's kindness catch you off guard? we'd love to hear it",
  "is there a moment of kindness you still think about? share it here",
  "someone out there needs to hear what you experienced. share your moment",
]

const COLUMNS = 'id, kindness, feeling, location, mood, created_at, posted_by, user_id'

export default function WallClient({ initialMoments }: { initialMoments: Moment[] }) {
  const [view, setView] = useState<View>('wall')
  const [user, setUser] = useState<User | null>(null)
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [mineMoments, setMineMoments] = useState<Moment[]>([])
  const [keptMoments, setKeptMoments] = useState<Moment[]>([])
  const [nudgeDismissed, setNudgeDismissed] = useState(false)
  const [showNudge, setShowNudge] = useState(false)
  const [nudgeExpanded, setNudgeExpanded] = useState(false)
  const [postTrigger, setPostTrigger] = useState(0)
  const nudgePrompt = useRef(NUDGE_PROMPTS[Math.floor(Math.random() * NUDGE_PROMPTS.length)])
  const supabase = createClient()

  // auth state
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  // load saved IDs whenever user changes
  useEffect(() => {
    if (!user) { setSavedIds(new Set()); return }
    supabase
      .from('saved_moments')
      .select('moment_id')
      .eq('user_id', user.id)
      .then(({ data }) => {
        if (data) setSavedIds(new Set(data.map((r: { moment_id: string }) => r.moment_id)))
      })
  }, [user])

  // 10-second nudge on wall view
  useEffect(() => {
    if (view !== 'wall' || nudgeDismissed) return
    const t = setTimeout(() => setShowNudge(true), 10000)
    return () => clearTimeout(t)
  }, [view, nudgeDismissed])

  // load mine moments
  useEffect(() => {
    if (view !== 'mine' || !user) return
    supabase
      .from('moments')
      .select(COLUMNS)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setMineMoments(data as Moment[]) })
  }, [view, user])

  // load kept moments
  useEffect(() => {
    if (view !== 'kept' || !user) return
    supabase
      .from('saved_moments')
      .select(`moment_id, moments:moment_id(${COLUMNS})`)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) {
          const moments = data
            .map((r: any) => r.moments)
            .filter(Boolean) as Moment[]
          setKeptMoments(moments)
        }
      })
  }, [view, user])

  function handleSaveToggle(momentId: string, isSaved: boolean) {
    setSavedIds(prev => {
      const next = new Set(prev)
      if (isSaved) next.add(momentId)
      else next.delete(momentId)
      return next
    })
    if (view === 'kept' && !isSaved) {
      setKeptMoments(prev => prev.filter(m => m.id !== momentId))
    }
  }

  function dismissNudge() {
    setNudgeDismissed(true)
    setShowNudge(false)
    setNudgeExpanded(false)
  }

  function nudgeShare() {
    setPostTrigger(t => t + 1)
    dismissNudge()
  }

  return (
    <>
      {view === 'wall' && (
        <Feed
          initialMoments={initialMoments}
          user={user}
          savedIds={savedIds}
          onSaveToggle={handleSaveToggle}
        />
      )}

      {view === 'mine' && (
        <SimpleList
          moments={mineMoments}
          user={user}
          savedIds={savedIds}
          onSaveToggle={handleSaveToggle}
          emptyMessage={user ? "you haven't posted anything yet" : "sign in to see your moments"}
        />
      )}

      {view === 'kept' && (
        <SimpleList
          moments={keptMoments}
          user={user}
          savedIds={savedIds}
          onSaveToggle={handleSaveToggle}
          emptyMessage={user ? "nothing saved yet" : "sign in to save moments"}
        />
      )}

      {showNudge && !nudgeDismissed && (
        <div className="fixed bottom-[80px] left-5 z-30">
          {nudgeExpanded ? (
            <div
              className="nudge-in rounded-2xl p-4 w-64"
              style={{
                background: 'var(--card)',
                boxShadow: '0 8px 32px -8px rgba(60,45,30,0.22), 0 2px 8px rgba(60,45,30,0.08)',
                border: '1px solid var(--line)',
              }}
            >
              <p className="text-[13px] text-[var(--ink-soft)] leading-relaxed mb-3">
                {nudgePrompt.current}
              </p>
              <div className="flex items-center justify-between">
                <button
                  onClick={nudgeShare}
                  className="text-[13px] font-medium text-[var(--accent)] hover:underline"
                >
                  share the moment
                </button>
                <button
                  onClick={dismissNudge}
                  className="text-[var(--ink-faint)] hover:text-[var(--ink)] text-lg leading-none"
                  aria-label="dismiss"
                >
                  ×
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setNudgeExpanded(true)}
              className="nudge-bubble w-11 h-11 rounded-full flex items-center justify-center"
              style={{ background: '#f0d9ce' }}
              aria-label="share a moment"
            >
              <span className="text-[var(--accent)] text-lg leading-none">✦</span>
            </button>
          )}
        </div>
      )}

      <PostModal user={user} externalTrigger={postTrigger} />
      <BottomNav activeView={view} onViewChange={setView} />
    </>
  )
}

function SimpleList({
  moments,
  user,
  savedIds,
  onSaveToggle,
  emptyMessage,
}: {
  moments: Moment[]
  user: User | null
  savedIds: Set<string>
  onSaveToggle: (id: string, saved: boolean) => void
  emptyMessage: string
}) {
  if (moments.length === 0) {
    return (
      <p className="text-center text-stone-400 text-sm py-20">{emptyMessage}</p>
    )
  }
  return (
    <div className="flex flex-col gap-5">
      {moments.map((m, i) => (
        <MomentCard
          key={m.id}
          moment={m}
          index={i}
          user={user}
          initialSaved={savedIds.has(m.id)}
          onSaveToggle={onSaveToggle}
        />
      ))}
    </div>
  )
}
