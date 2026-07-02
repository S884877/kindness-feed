'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { getSession } from '@/lib/session'
import ChainTree from '@/components/ChainTree'

export default function ChainTreePage() {
  const params = useParams<{ chainId: string }>()
  const router = useRouter()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const session = getSession()
    if (!session) {
      router.replace(`/login?next=${encodeURIComponent(`/chain/${params.chainId}`)}`)
      return
    }
    setReady(true)
  }, [router, params.chainId])

  if (!ready) return null

  return (
    <div className="feed-frame px-5">
      <h1 className="font-serif text-[24px] text-[var(--ink)] mb-2">the chain</h1>
      <p className="text-[14px] text-[var(--ink-faint)] mb-8">every link, from the first act to the latest.</p>
      <ChainTree chainId={params.chainId} />
      <div className="mt-10 text-center">
        <Link href="/" className="text-sm text-[var(--ink-faint)] hover:text-[var(--ink)] transition-colors">
          ← back home
        </Link>
      </div>
    </div>
  )
}
