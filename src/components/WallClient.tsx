'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getSession, type Session } from '@/lib/session'
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
  const [editMoment, setEditMoment] = useState<Moment | null>(null)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    setSession(getSession())
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
        <SimpleList
          moments={mineMoments}
          session={session}
          savedIds={savedIds}
          onSaveToggle={handleSaveToggle}
          onAuthRequired={handleAuthRequired}
          emptyMessage="you haven't posted anything yet"
          showMineActions
          onEdit={setEditMoment}
          onDelete={(id) => setMineMoments(prev => prev.filter(m => m.id !== id))}
        />
      )}

      {view === 'kept' && (
        <SimpleList
          moments={keptMoments}
          session={session}
          savedIds={savedIds}
          onSaveToggle={handleSaveToggle}
          onAuthRequired={handleAuthRequired}
          emptyMessage="nothing saved yet"
        />
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
      <BottomNav activeView={view} onViewChange={handleViewChange} />
    </>
  )
}

function SimpleList({
  moments,
  session,
  savedIds,
  onSaveToggle,
  onAuthRequired,
  emptyMessage,
  showMineActions = false,
  onEdit,
  onDelete,
}: {
  moments: Moment[]
  session: Session | null
  savedIds: Set<string>
  onSaveToggle: (id: string, saved: boolean) => void
  onAuthRequired: () => void
  emptyMessage: string
  showMineActions?: boolean
  onEdit?: (moment: Moment) => void
  onDelete?: (id: string) => void
}) {
  if (moments.length === 0) {
    return <p className="text-center text-stone-400 text-sm py-20">{emptyMessage}</p>
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
