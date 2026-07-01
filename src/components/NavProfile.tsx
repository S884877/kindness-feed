'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getSession } from '@/lib/session'

export default function NavProfile() {
  const [href, setHref] = useState('/login')

  useEffect(() => {
    if (getSession()) setHref('/?view=mine')
  }, [])

  return (
    <Link href={href} aria-label="my profile" className="text-[var(--ink-faint)] hover:text-[var(--ink)] transition-colors">
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    </Link>
  )
}
