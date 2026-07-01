'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getSession, clearSession, type Session } from '@/lib/session'
import Feed from './Feed'
import PostModal from './PostModal'
import BottomNav from './BottomNav'
import MomentCard from './MomentCard'
import { Moment } from '@/lib/types'

type View = 'mine' | 'wall' | 'kept'

const COLUMNS = 'id, kindness, feeling, location, mood, image_url, created_at, posted_by, user_id'

export default function WallClient({ initialMoments }: { initialMoments: Moment[] }) {
  const [view, setView] = useState<View>('wall')
  const [session, setSession] = useState<Session | null>(null)
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [mineMoments, setMineMoments] = useState<Moment[]>([])
  const [keptMoments, setKeptMoments] = useState<Moment[]>([])
  const [showAuthGate, setShowAuthGate] = useState(false)
  const [showNudgePopup, setShowNudgePopup] = useState(false)
  const [editMoment, setEditMoment] = useState<Moment | null>(null)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const s = getSession()
    setSession(s)
    if (s && new URLSearchParams(window.location.search).get('view') === 'mine') {
      setView('mine')
    }
    if (!s && !sessionStorage.getItem('nudge_shown')) {
      const t = setTimeout(() => {
        setShowNudgePopup(true)
        sessionStorage.setItem('nudge_shown', '1')
      }, 10000)
      return () => clearTimeout(t)
    }
  }, [])

  useEffect(() => {
    if (!session) { setSavedIds(new Set()); return }
    supabase
      .from('saved_moments')
      .select('moment_id')
      .eq('user_id', session.id)
      .then(({ data, error }) => {
        if (error) console.error('savedIds fetch error:', error)
        if (data) setSavedIds(new Set(data.map((r: { moment_id: string }) => r.moment_id)))
      })
  }, [session])

  useEffect(() => {
    if (view !== 'mine' || !session) return
    supabase
      .from('moments')
      .select(COLUMNS)
      .eq('user_id', session.id)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) console.error('mine fetch error:', error)
        if (data) setMineMoments(data as Moment[])
      })
  }, [view, session])

  useEffect(() => {
    if (view !== 'kept' || !session) return
    supabase
      .from('saved_moments')
      .select(`moment_id, moments:moment_id(${COLUMNS})`)
      .eq('user_id', session.id)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) console.error('kept fetch error:', error)
        if (data) {
          const moments = data.map((r: any) => r.moments).filter(Boolean) as Moment[]
          setKeptMoments(moments)
        }
      })
  }, [view, session])

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
    if ((v === 'mine' || v === 'kept') && !session) {
      setShowAuthGate(true)
      return
    }
    setView(v)
  }

  function handleAuthRequired() {
    setShowAuthGate(true)
  }

  function handleNudgeShare() {
    if (!session) { setShowAuthGate(true); return }
    router.push('/share')
  }

  return (
    <>
      {view === 'wall' && (
        <Feed
          initialMoments={initialMoments}
          session={session}
          savedIds={savedIds}
          onSaveToggle={handleSaveToggle}
          onAuthRequired={handleAuthRequired}
          onNudgeShare={handleNudgeShare}
        />
      )}

      {view === 'mine' && (
        <>
          {mineMoments.length === 0 ? (
            <MineEmptyState />
          ) : (
            <SimpleList
              moments={mineMoments}
              session={session}
              savedIds={savedIds}
              onSaveToggle={handleSaveToggle}
              onAuthRequired={handleAuthRequired}
              showMineActions
              onEdit={setEditMoment}
              onDelete={(id) => setMineMoments(prev => prev.filter(m => m.id !== id))}
            />
          )}
          <div className="text-center mt-12 pb-2">
            <button
              onClick={() => { clearSession(); window.location.href = '/' }}
              className="text-xs text-[var(--ink-faint)] hover:text-[var(--ink)] transition-colors"
            >
              sign out
            </button>
          </div>
        </>
      )}

      {view === 'kept' && (
        <SimpleList
          moments={keptMoments}
          session={session}
          savedIds={savedIds}
          onSaveToggle={handleSaveToggle}
          onAuthRequired={handleAuthRequired}
        />
      )}

      {showNudgePopup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-6"
          style={{ background: 'rgba(44,38,32,0.25)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowNudgePopup(false)}
        >
          <div
            className="relative bg-[#fffdf9] rounded-2xl px-8 py-7 text-center max-w-xs w-full"
            style={{ boxShadow: '0 16px 48px -12px rgba(60,45,30,0.28), 0 4px 12px rgba(60,45,30,0.08)' }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setShowNudgePopup(false)}
              className="absolute top-4 right-4 text-[var(--ink-faint)] hover:text-[var(--ink)] transition-colors text-lg leading-none"
              aria-label="close"
            >
              ×
            </button>
            <p className="font-serif text-[20px] text-[var(--ink)] mb-2">post something to the wall</p>
            <p className="text-sm text-[var(--ink-faint)] mb-6">share a moment of kindness someone showed you.</p>
            <Link
              href="/login"
              className="block text-white font-semibold py-3 rounded-xl text-[15px] text-center"
              style={{ background: 'linear-gradient(135deg, #cf7152, #b85a3e)' }}
              onClick={() => setShowNudgePopup(false)}
            >
              get started
            </Link>
            <button
              onClick={() => setShowNudgePopup(false)}
              className="mt-3 text-sm text-[var(--ink-faint)] hover:text-[var(--ink)] transition-colors"
            >
              maybe later
            </button>
          </div>
        </div>
      )}

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

      {/* floating share FAB — sits directly above the Listen button in Feed */}
      <button
        onClick={() => { if (!session) { setShowAuthGate(true); return } router.push('/share') }}
        aria-label="share a moment"
        className="fixed z-30 flex items-center justify-center rounded-full active:scale-95 transition-transform"
        style={{
          bottom: '148px',
          right: '20px',
          width: '44px',
          height: '44px',
          background: 'linear-gradient(135deg, #cf7152, #b85a3e)',
          boxShadow: '0 4px 16px rgba(60,45,30,0.25)',
          fontSize: '22px',
          fontWeight: 300,
          color: 'white',
          lineHeight: 1,
        }}
      >
        +
      </button>

      <PostModal
        editMoment={editMoment}
        onEditDone={() => {
          setEditMoment(null)
          if (session) {
            supabase
              .from('moments')
              .select(COLUMNS)
              .eq('user_id', session.id)
              .order('created_at', { ascending: false })
              .then(({ data, error }) => {
                if (error) console.error('mine refresh error:', error)
                if (data) setMineMoments(data as Moment[])
              })
          }
        }}
      />
      <BottomNav
        activeView={view}
        onViewChange={handleViewChange}
        onShare={() => { if (!session) { setShowAuthGate(true); return } router.push('/share') }}
      />
    </>
  )
}

function MineEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-20">
      <svg width="52" height="48" viewBox="0 0 52 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-7 opacity-80">
        <path
          d="M26 44C26 44 4 30.5 4 15.5C4 9.4 8.9 4.5 15 4.5C19 4.5 22.5 6.5 25 9.5C27.5 6.5 31 4.5 37 4.5C43.1 4.5 48 9.4 48 15.5C48 30.5 26 44 26 44Z"
          stroke="#c2674c"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <p className="font-serif text-[19px] leading-[1.65] text-[var(--ink-soft)] mb-8">
        you haven't shared anything yet.<br />
        when you're ready, we're here.
      </p>
      <Link
        href="/share"
        className="press text-white font-semibold px-6 py-3.5 rounded-full text-[14px]"
        style={{ background: 'linear-gradient(135deg, #cf7152, #b85a3e)' }}
      >
        share your first moment
      </Link>
    </div>
  )
}

function SimpleList({
  moments,
  session,
  savedIds,
  onSaveToggle,
  onAuthRequired,
  showMineActions = false,
  onEdit,
  onDelete,
}: {
  moments: Moment[]
  session: Session | null
  savedIds: Set<string>
  onSaveToggle: (id: string, saved: boolean) => void
  onAuthRequired: () => void
  showMineActions?: boolean
  onEdit?: (moment: Moment) => void
  onDelete?: (id: string) => void
}) {
  if (moments.length === 0) {
    return <p className="text-center text-stone-400 text-sm py-20">nothing saved yet</p>
  }
  return (
    <div className="flex flex-col gap-5">
      {moments.map((m, i) => (
        <MomentCard
          key={m.id}
          moment={m}
          index={i}
          session={session}
          initialSaved={savedIds.has(m.id)}
          onSaveToggle={onSaveToggle}
          onAuthRequired={onAuthRequired}
          showMineActions={showMineActions}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}
