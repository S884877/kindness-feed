'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { getSession, clearSession, type Session } from '@/lib/session'

export default function NavBar() {
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    setSession(getSession())
    function onStorage(e: StorageEvent) {
      if (e.key === 'kp_session') setSession(getSession())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  function handleLogout() {
    clearSession()
    window.location.href = '/'
  }

  return (
    <header
      className="fixed top-0 left-0 right-0 z-20"
      style={{
        background: 'rgba(252, 249, 243, 0.82)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--line)',
      }}
    >
      <nav className="nav-inner h-16 flex items-center justify-between px-5">
        <Link href="/" className="font-serif text-[var(--ink)] text-xl tracking-tight">
          the kindness project
        </Link>
        {session && (
          <button
            onClick={handleLogout}
            className="text-xs text-[var(--ink-faint)] hover:text-[var(--ink)] transition-colors"
          >
            sign out
          </button>
        )}
      </nav>
    </header>
  )
}
