'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { clearSession, type Session } from '@/lib/session'
import MomentCard from './MomentCard'
import PostModal from './PostModal'
import { Moment } from '@/lib/types'

const COLUMNS = 'id, kindness, feeling, location, mood, image_url, created_at, posted_by, user_id'

type Tab = 'mine' | 'saved'

export default function ProfileTab({
  session,
  savedIds,
  onSaveToggle,
  onAuthRequired,
}: {
  session: Session
  savedIds: Set<string>
  onSaveToggle: (id: string, saved: boolean) => void
  onAuthRequired: () => void
}) {
  const [tab, setTab] = useState<Tab>('mine')
  const [mineMoments, setMineMoments] = useState<Moment[]>([])
  const [savedMoments, setSavedMoments] = useState<Moment[]>([])
  const [editMoment, setEditMoment] = useState<Moment | null>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase
      .from('moments')
      .select(COLUMNS)
      .eq('user_id', session.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setMineMoments(data as Moment[]) })
  }, [session.id])

  useEffect(() => {
    if (tab !== 'saved') return
    supabase
      .from('saved_moments')
      .select(`moment_id, moments:moment_id(${COLUMNS})`)
      .eq('user_id', session.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setSavedMoments(data.map((r: any) => r.moments).filter(Boolean) as Moment[])
      })
  }, [tab, session.id])

  function signOut() {
    clearSession()
    window.location.href = '/wall'
  }

  function refreshMine() {
    supabase
      .from('moments')
      .select(COLUMNS)
      .eq('user_id', session.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setMineMoments(data as Moment[]) })
  }

  const activeStyle = {
    background: 'linear-gradient(135deg, #cf7152, #b85a3e)',
    color: '#fffdf9',
    transition: 'all 0.2s ease',
  }
  const inactiveStyle = {
    background: 'transparent',
    color: 'var(--ink-faint)',
    transition: 'all 0.2s ease',
  }

  return (
    <div>
      {/* toggle */}
      <div
        className="flex rounded-full p-1 mb-6"
        style={{ background: '#f0e4d4' }}
      >
        <button
          onClick={() => setTab('mine')}
          className="flex-1 py-2 rounded-full text-[14px] font-semibold"
          style={tab === 'mine' ? activeStyle : inactiveStyle}
        >
          mine
        </button>
        <button
          onClick={() => setTab('saved')}
          className="flex-1 py-2 rounded-full text-[14px] font-semibold"
          style={tab === 'saved' ? activeStyle : inactiveStyle}
        >
          saved
        </button>
      </div>

      {/* content */}
      {tab === 'mine' && (
        mineMoments.length === 0 ? (
          <MineEmpty />
        ) : (
          <div className="flex flex-col gap-5">
            {mineMoments.map((m, i) => (
              <MomentCard
                key={m.id}
                moment={m}
                index={i}
                session={session}
                initialSaved={savedIds.has(m.id)}
                onSaveToggle={onSaveToggle}
                onAuthRequired={onAuthRequired}
                showMineActions
                onEdit={setEditMoment}
                onDelete={(id) => setMineMoments(prev => prev.filter(x => x.id !== id))}
              />
            ))}
          </div>
        )
      )}

      {tab === 'saved' && (
        savedMoments.length === 0 ? (
          <p className="text-center text-[var(--ink-faint)] text-sm py-20">nothing saved yet</p>
        ) : (
          <div className="flex flex-col gap-5">
            {savedMoments.map((m, i) => (
              <MomentCard
                key={m.id}
                moment={m}
                index={i}
                session={session}
                initialSaved={savedIds.has(m.id)}
                onSaveToggle={(id, saved) => {
                  onSaveToggle(id, saved)
                  if (!saved) setSavedMoments(prev => prev.filter(x => x.id !== id))
                }}
                onAuthRequired={onAuthRequired}
              />
            ))}
          </div>
        )
      )}

      {/* sign out — always at bottom */}
      <div className="text-center mt-12 pb-6">
        <button
          onClick={signOut}
          className="text-xs text-[var(--ink-faint)] hover:text-[var(--ink)] transition-colors"
        >
          sign out
        </button>
      </div>

      <PostModal
        editMoment={editMoment}
        onEditDone={() => {
          setEditMoment(null)
          refreshMine()
        }}
      />
    </div>
  )
}

function MineEmpty() {
  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-20">
      <svg width="52" height="48" viewBox="0 0 52 48" fill="none" className="mb-7 opacity-80">
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
