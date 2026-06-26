'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Feed from './Feed'
import PostModal from './PostModal'
import BottomNav from './BottomNav'
import MomentCard from './MomentCard'
import { Moment } from '@/lib/types'
import type { User } from '@supabase/supabase-js'

type View = 'mine' | 'wall' | 'kept'

const NUDGE_PROMPTS = [
  "you've been reading for a while. something must have stayed with you.",
  "someone was kind to you once. this is a good place to leave that.",
  "the person who needs to read your moment is already here.",
  "kindness deserves to travel. share yours.",
]

const COLUMNS = 'id, kindness, feeling, location, mood, created_at, posted_by, user_id'

export default function WallClient({ initialMoments }: { initialMoments: Moment[] }) {
  const [view, setView] = useState<View>('wall')
  const [user, setUser] = useState<User | null>(null)
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [mineMoments, setMineMoments] = useState<Moment[]>([])
  const [keptMoments, setKeptMoments] = useState<Moment[]>([])
  const [postTrigger, setPostTrigger] = useState(0)

  // auth gate
  const [showAuthGate, setShowAuthGate] = useState(false)

  // nudge modal
  const [nudgeOpen, setNudgeOpen] = useState(false)
  const [nudgePermanentDismiss, setNudgePermanentDismiss] = useState(false)
  const nudgePromptIndex = useRef(0)
  const nudgeEligible = useRef(false)
  const nudgeLastOverlayDismiss = useRef<number>(0)
  const nudgeReshowTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

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
          const moments = data.map((r: any) => r.moments).filter(Boolean) as Moment[]
          setKeptMoments(moments)
        }
      })
  }, [view, user])

  // --- nudge: exit intent ---
  const openNudge = useCallback(() => {
    if (nudgePermanentDismiss || nudgeOpen) return
    setNudgeOpen(true)
  }, [nudgePermanentDismiss, nudgeOpen])

  // 10-second eligibility gate
  useEffect(() => {
    if (view !== 'wall' || nudgePermanentDismiss) return
    nudgeEligible.current = false
    const t = setTimeout(() => { nudgeEligible.current = true }, 10000)
    return () => clearTimeout(t)
  }, [view, nudgePermanentDismiss])

  // desktop: exit intent mouse
  useEffect(() => {
    if (nudgePermanentDismiss) return

    function onMouseMove(e: MouseEvent) {
      if (!nudgeEligible.current || nudgeOpen) return
      if (e.clientY < 50) openNudge()
    }

    window.addEventListener('mousemove', onMouseMove)
    return () => window.removeEventListener('mousemove', onMouseMove)
  }, [nudgePermanentDismiss, nudgeOpen, openNudge])

  // mobile: scroll inactivity (10s no scroll after eligible)
  useEffect(() => {
    if (nudgePermanentDismiss) return

    let inactivityTimer: ReturnType<typeof setTimeout> | null = null

    function resetTimer() {
      if (inactivityTimer) clearTimeout(inactivityTimer)
      if (!nudgeEligible.current || nudgeOpen) return
      inactivityTimer = setTimeout(() => openNudge(), 10000)
    }

    window.addEventListener('scroll', resetTimer, { passive: true })
    return () => {
      window.removeEventListener('scroll', resetTimer)
      if (inactivityTimer) clearTimeout(inactivityTimer)
    }
  }, [nudgePermanentDismiss, nudgeOpen, openNudge])

  function handleNudgeOverlayDismiss() {
    setNudgeOpen(false)
    nudgeLastOverlayDismiss.current = Date.now()
    // advance to next prompt for re-show
    nudgePromptIndex.current = (nudgePromptIndex.current + 1) % NUDGE_PROMPTS.length
    // re-trigger after 2 minutes
    if (nudgeReshowTimer.current) clearTimeout(nudgeReshowTimer.current)
    nudgeReshowTimer.current = setTimeout(() => {
      if (!nudgePermanentDismiss) openNudge()
    }, 120000)
  }

  function handleNudgeNotNow() {
    setNudgeOpen(false)
    setNudgePermanentDismiss(true)
    if (nudgeReshowTimer.current) clearTimeout(nudgeReshowTimer.current)
  }

  function handleNudgeShare() {
    setNudgeOpen(false)
    setNudgePermanentDismiss(true)
    if (nudgeReshowTimer.current) clearTimeout(nudgeReshowTimer.current)
    setPostTrigger(t => t + 1)
  }

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

  function handleViewChange(v: View) {
    if ((v === 'mine' || v === 'kept') && !user) {
      setShowAuthGate(true)
      return
    }
    setView(v)
  }

  function handleAuthRequired() {
    setShowAuthGate(true)
  }

  return (
    <>
      {view === 'wall' && (
        <Feed
          initialMoments={initialMoments}
          user={user}
          savedIds={savedIds}
          onSaveToggle={handleSaveToggle}
          onAuthRequired={handleAuthRequired}
        />
      )}

      {view === 'mine' && (
        <SimpleList
          moments={mineMoments}
          user={user}
          savedIds={savedIds}
          onSaveToggle={handleSaveToggle}
          onAuthRequired={handleAuthRequired}
          emptyMessage="you haven't posted anything yet"
        />
      )}

      {view === 'kept' && (
        <SimpleList
          moments={keptMoments}
          user={user}
          savedIds={savedIds}
          onSaveToggle={handleSaveToggle}
          onAuthRequired={handleAuthRequired}
          emptyMessage="nothing saved yet"
        />
      )}

      {/* auth gate */}
      {showAuthGate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-6"
          style={{ background: 'rgba(44,38,32,0.25)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowAuthGate(false)}
        >
          <div
            className="bg-[#fffdf9] rounded-2xl px-8 py-7 text-center max-w-xs w-full"
            style={{ boxShadow: '0 16px 48px -12px rgba(60,45,30,0.28), 0 4px 12px rgba(60,45,30,0.08)' }}
            onClick={e => e.stopPropagation()}
          >
            <p className="font-serif text-[20px] text-[var(--ink)] mb-1">sign in to do this</p>
            <p className="text-sm text-[var(--ink-faint)] mb-6">create an account or sign in to continue</p>
            <Link
              href="/login"
              className="block text-white font-semibold py-3 rounded-xl text-[15px] text-center"
              style={{ background: 'linear-gradient(135deg, #cf7152, #b85a3e)' }}
            >
              sign in
            </Link>
            <button
              onClick={() => setShowAuthGate(false)}
              className="mt-3 text-sm text-[var(--ink-faint)] hover:text-[var(--ink)] transition-colors"
            >
              not now
            </button>
          </div>
        </div>
      )}

      {/* exit intent nudge modal */}
      {nudgeOpen && (
        <div
          className="backdrop-in fixed inset-0 z-50 flex items-center justify-center px-6"
          style={{ background: 'rgba(44,38,32,0.45)' }}
          onClick={handleNudgeOverlayDismiss}
        >
          <div
            className="sheet-in bg-[#fffdf9] rounded-[28px] w-full max-w-sm px-10 py-10 text-center"
            style={{ boxShadow: '0 32px 80px -20px rgba(60,45,30,0.38), 0 8px 24px rgba(60,45,30,0.12)' }}
            onClick={e => e.stopPropagation()}
          >
            <p className="font-serif text-[22px] leading-[1.45] text-[var(--ink)] mb-8">
              {NUDGE_PROMPTS[nudgePromptIndex.current]}
            </p>
            <button
              onClick={handleNudgeShare}
              className="press block w-full text-white font-semibold py-3.5 rounded-2xl text-[15px] mb-3"
              style={{ background: 'linear-gradient(135deg, #cf7152, #b85a3e)' }}
            >
              share my moment
            </button>
            <button
              onClick={handleNudgeNotNow}
              className="text-sm text-[var(--ink-faint)] hover:text-[var(--ink)] transition-colors py-1"
            >
              not now
            </button>
          </div>
        </div>
      )}

      <PostModal user={user} externalTrigger={postTrigger} onAuthRequired={handleAuthRequired} />
      <BottomNav activeView={view} onViewChange={handleViewChange} />
    </>
  )
}

function SimpleList({
  moments,
  user,
  savedIds,
  onSaveToggle,
  onAuthRequired,
  emptyMessage,
}: {
  moments: Moment[]
  user: User | null
  savedIds: Set<string>
  onSaveToggle: (id: string, saved: boolean) => void
  onAuthRequired: () => void
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
          onAuthRequired={onAuthRequired}
        />
      ))}
    </div>
  )
}
