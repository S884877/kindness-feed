'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getSession, type Session } from '@/lib/session'
import Feed from './Feed'
import BottomNav from './BottomNav'
import ChainTab from './ChainTab'
import ProfileTab from './ProfileTab'
import { Moment } from '@/lib/types'

type View = 'wall' | 'chain' | 'profile'

export default function WallClient({
  initialMoments,
  initialRef,
}: {
  initialMoments: Moment[]
  initialRef?: string
}) {
  const [view, setView] = useState<View>('chain')
  const [session, setSession] = useState<Session | null>(null)
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [showAuthGate, setShowAuthGate] = useState(false)
  const [showNudgePopup, setShowNudgePopup] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const s = getSession()
    setSession(s)

    // restore tab from post-auth redirect or URL params
    const params = new URLSearchParams(window.location.search)
    if (params.get('tab') === 'chain') {
      setView('chain')
      window.history.replaceState({}, '', '/wall')
    } else if (localStorage.getItem('pending_tab') === 'chain') {
      localStorage.removeItem('pending_tab')
      setView('chain')
    } else if (s && params.get('view') === 'mine') {
      setView('profile')
    }

    if (initialRef) {
      window.history.replaceState({}, '', window.location.pathname)
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

  function handleSaveToggle(momentId: string, isSaved: boolean) {
    setSavedIds(prev => {
      const next = new Set(prev)
      if (isSaved) next.add(momentId)
      else next.delete(momentId)
      return next
    })
  }

  function handleViewChange(v: View) {
    if (v === 'profile' && !session) {
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

      {view === 'chain' && <ChainTab initialRef={initialRef} />}

      {view === 'profile' && session && (
        <ProfileTab
          session={session}
          savedIds={savedIds}
          onSaveToggle={handleSaveToggle}
          onAuthRequired={handleAuthRequired}
        />
      )}

      {/* nudge popup for logged-out users */}
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

      {/* floating share FAB */}
      {view === 'wall' && (
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
      )}

      <BottomNav activeView={view} onViewChange={handleViewChange} />
    </>
  )
}
