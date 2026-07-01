'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import ChainCounter from './ChainCounter'
import ChainForm from './ChainForm'
import ChainDashboard from './ChainDashboard'
import { getSession, type Session } from '@/lib/session'
import { trackChainLinkOpen, trackChainSignin } from '@/lib/metrics'
import type { ChainAct } from '@/lib/chain'

export default function ChainHome({
  parentToken,
  parentPost,
}: {
  parentToken?: string
  parentPost?: ChainAct | null
}) {
  const [showForm, setShowForm] = useState(!!parentToken)
  const [session, setSession] = useState<Session | null | undefined>(undefined)

  useEffect(() => {
    const s = getSession()
    setSession(s)

    if (parentPost) {
      // track every unique visitor who opens a chain link
      trackChainLinkOpen(parentPost.chain_id, parentPost.user_id)

      // track signin once per session when a logged-in user arrives via chain link
      if (s) {
        const key = `cst_${parentPost.chain_id}`
        if (!sessionStorage.getItem(key)) {
          trackChainSignin(s.id, parentPost.chain_id, parentPost.user_id)
          sessionStorage.setItem(key, '1')
        }
      }
    }
  }, [])

  // still checking localStorage on mount — avoid a flash of the wrong state
  if (session === undefined) return null

  // signed-in visitors with no invite link land on their own chain, not the
  // generic pitch — the tree + share options is what they came back to see.
  if (session && !parentToken) {
    return (
      <div className="feed-frame px-5">
        <ChainCounter />
        <div className="mt-6">
          <ChainDashboard session={session} />
        </div>
      </div>
    )
  }

  return (
    <div className="feed-frame px-5">
      <ChainCounter />

      {!parentToken && (
        <div className="text-center mt-10 mb-10">
          <p className="font-serif text-[19px] leading-[1.6] text-[var(--ink)] mb-1">
            hey there, did something kind lately?
          </p>
          <p className="text-[14px] leading-[1.7] text-[var(--ink-faint)] max-w-sm mx-auto mt-3">
            tell us about it and invite your friends to join your chain! we are on a collective mission to ignite 1 million acts of kindness this week. together, let's see just how far your single act of good can travel.
          </p>
        </div>
      )}

      {parentToken && (
        <div className="mt-8 mb-10">
          {parentPost ? (
            <div
              className="rounded-[22px] px-6 py-5 mb-5"
              style={{ background: '#fdf0e6', border: '1px solid #f0d5be' }}
            >
              <p className="font-serif text-[16px] leading-[1.5] text-[var(--ink)] mb-2">{parentPost.act_text}</p>
              <p className="font-serif italic text-[14px] leading-[1.5] text-[var(--ink-soft)]">{parentPost.feeling_text}</p>
              {parentPost.location_text && (
                <p className="text-[12px] text-[var(--ink-faint)] mt-3">{parentPost.location_text}</p>
              )}
            </div>
          ) : (
            <p className="text-center text-[14px] text-[var(--ink-faint)] mb-5">this link couldn't be found — but you can still start your own chain below.</p>
          )}
          <p className="font-serif text-[18px] leading-[1.5] text-[var(--ink)] text-center mb-2">
            you've been invited to join thekindnesscollective chain.
          </p>
          <p className="text-[13px] text-[var(--ink-faint)] text-center">
            share something kind you did today, keep the chain moving.{' '}
            {parentPost && (
              <Link href={`/chain/${parentPost.chain_id}`} className="text-[var(--accent)] hover:underline">
                see the whole chain
              </Link>
            )}
          </p>
        </div>
      )}

      {!showForm && !parentToken && (
        <div className="text-center mb-16">
          <button
            onClick={() => setShowForm(true)}
            className="press text-white font-semibold px-7 py-3.5 rounded-full text-[15px]"
            style={{ background: 'linear-gradient(135deg, #cf7152, #b85a3e)' }}
          >
            start a chain
          </button>
        </div>
      )}

      {showForm && (
        <div className="mb-16">
          <ChainForm parentToken={parentToken} />
        </div>
      )}

      <div className="text-center pb-4">
        <Link href="/wall" className="text-sm text-[var(--ink-faint)] hover:text-[var(--ink)] transition-colors">
          see the kindness wall →
        </Link>
      </div>
    </div>
  )
}
