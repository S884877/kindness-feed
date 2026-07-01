'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { clearSession, type Session } from '@/lib/session'
import { chainShareUrl, type ChainAct } from '@/lib/chain'
import ChainTree from './ChainTree'
import ChainShareMenu from './ChainShareMenu'
import ChainForm from './ChainForm'

export default function ChainDashboard({ session }: { session: Session }) {
  const [latest, setLatest] = useState<ChainAct | null | undefined>(undefined)
  const [showNewForm, setShowNewForm] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('chain_acts')
      .select('*')
      .eq('user_id', session.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) console.error('latest chain fetch error:', error)
        setLatest((data as ChainAct) ?? null)
      })
  }, [session.id])

  function signOut() {
    clearSession()
    window.location.href = '/'
  }

  if (latest === undefined) return null

  if (!latest) {
    return (
      <div>
        <p className="font-serif text-[18px] leading-[1.6] text-[var(--ink)] text-center mb-8">
          you haven't started a chain yet — post your first act of kindness to begin one.
        </p>
        <div className="mb-10">
          <ChainForm />
        </div>
        <div className="text-center pb-4">
          <button onClick={signOut} className="text-sm text-[var(--ink-faint)] hover:text-[var(--ink)] transition-colors">
            sign out
          </button>
        </div>
      </div>
    )
  }

  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const shareUrl = chainShareUrl(origin, latest.share_token)
  const message = `Someone shared an act of kindness and started a chain.\nNow it's your turn. Add your own act and join the chain.\nTogether, we're building 1,000,000 acts this week. Let's go. ${shareUrl}`

  return (
    <div>
      <div className="text-center mb-8">
        <ChainShareMenu shareUrl={shareUrl} message={message} userId={session.id} actId={latest.id} />
      </div>

      <ChainTree chainId={latest.chain_id} />

      <div className="text-center mt-8 mb-4">
        {showNewForm ? (
          <div className="text-left mb-6">
            <ChainForm key={latest.id} />
          </div>
        ) : (
          <button
            onClick={() => setShowNewForm(true)}
            className="text-sm text-[var(--ink-faint)] hover:text-[var(--ink)] transition-colors"
          >
            start another chain
          </button>
        )}
      </div>

      <div className="text-center pb-4">
        <button onClick={signOut} className="text-sm text-[var(--ink-faint)] hover:text-[var(--ink)] transition-colors">
          sign out
        </button>
      </div>
    </div>
  )
}
