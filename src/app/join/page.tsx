'use client'

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { getSession } from '@/lib/session'

export default function JoinPage() {
  return (
    <Suspense fallback={null}>
      <JoinInner />
    </Suspense>
  )
}

function JoinInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const ref = searchParams.get('ref')

  useEffect(() => {
    if (!ref) {
      router.replace('/share')
      return
    }
    const session = getSession()
    if (session) {
      sessionStorage.setItem('chain_ref', ref)
      router.replace('/share')
    }
  }, [ref, router])

  if (!ref) return null

  const session = getSession()
  if (session) return null

  const currentUrl = `/join?ref=${ref}`

  return (
    <div className="feed-frame px-5 flex flex-col items-center justify-center text-center" style={{ minHeight: '70vh' }}>
      <p
        className="text-[11px] font-semibold uppercase tracking-[0.1em] mb-6"
        style={{ color: 'var(--ink-faint)' }}
      >
        you've been invited to the chain
      </p>

      <h1 className="font-serif text-[28px] leading-[1.45] text-[var(--ink)] mb-4 max-w-xs">
        someone passed on a kindness and now it's your turn.
      </h1>

      <p className="text-[15px] leading-[1.65] text-[var(--ink-soft)] mb-10 max-w-xs">
        add your own act and keep the chain alive. together we're building 1,000,000 acts of kindness.
      </p>

      <div className="flex flex-col gap-3 w-full max-w-[240px]">
        <Link
          href={`/signup?next=${encodeURIComponent(currentUrl)}`}
          className="press text-white font-semibold py-3.5 rounded-full text-[15px] text-center"
          style={{ background: 'linear-gradient(135deg, #cf7152, #b85a3e)', boxShadow: '0 4px 20px -4px rgba(184,90,62,0.5)' }}
        >
          create account
        </Link>
        <Link
          href={`/login?next=${encodeURIComponent(currentUrl)}`}
          className="press font-semibold py-3.5 rounded-full text-[15px] text-center border"
          style={{ color: 'var(--accent)', borderColor: 'rgba(194,103,76,0.3)' }}
        >
          sign in
        </Link>
      </div>
    </div>
  )
}
