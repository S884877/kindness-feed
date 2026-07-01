'use client'

import { useState } from 'react'
import Link from 'next/link'
import ChainCounter from './ChainCounter'
import ChainForm from './ChainForm'
import type { ChainAct } from '@/lib/chain'

export default function ChainHome({
  parentToken,
  parentPost,
}: {
  parentToken?: string
  parentPost?: ChainAct | null
}) {
  const [showForm, setShowForm] = useState(!!parentToken)

  return (
    <div className="feed-frame px-5">
      <ChainCounter />

      {!parentToken && (
        <div className="text-center mt-10 mb-10">
          <p className="font-serif text-[19px] leading-[1.6] text-[var(--ink)] mb-1">
            pay it forward, one act at a time.
          </p>
          <p className="text-[14px] leading-[1.7] text-[var(--ink-faint)] max-w-sm mx-auto mt-3">
            post an act of kindness, get a link, share it. whoever posts through your link becomes the next person in your chain — and their link starts a new branch. we're trying to reach 1,000,000 acts this week.
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
            you've been invited to continue this chain.
          </p>
          <p className="text-[13px] text-[var(--ink-faint)] text-center">
            add your own act of kindness to keep it going.{' '}
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
