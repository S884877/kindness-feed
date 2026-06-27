'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { getSession, clearSession, type Session } from '@/lib/session'

function UserIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

export default function NavBar() {
  const [session, setSession] = useState<Session | null>(null)
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setSession(getSession())
    function onStorage(e: StorageEvent) {
      if (e.key === 'kp_session') setSession(getSession())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
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

        <div className="flex items-center gap-4">
          <Link
            href="/about"
            className="text-xs text-[var(--ink-faint)] hover:text-[var(--ink)] transition-colors"
          >
            how this started
          </Link>

          {session && (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setOpen(o => !o)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-[var(--ink-faint)] hover:text-[var(--ink)] hover:bg-[#ece5da] transition-colors"
                aria-label="account"
              >
                <UserIcon />
              </button>

              {open && (
                <div
                  className="absolute right-0 top-full mt-2 rounded-xl overflow-hidden"
                  style={{
                    background: '#fffdf9',
                    border: '1px solid var(--line)',
                    boxShadow: '0 8px 24px -4px rgba(60,45,30,0.14)',
                    minWidth: '120px',
                  }}
                >
                  <button
                    onClick={() => { handleLogout(); setOpen(false) }}
                    className="w-full text-left px-4 py-3 text-[13px] text-[var(--ink-faint)] hover:bg-[var(--cream)] hover:text-[var(--ink)] transition-colors"
                  >
                    sign out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </nav>
    </header>
  )
}
