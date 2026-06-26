'use client'

import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'

export default function NavBar({ user }: { user: User | null }) {
  const router = useRouter()
  const supabase = createClient()

  async function signOut() {
    await supabase.auth.signOut()
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-stone-100">
      <nav className="max-w-xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="text-stone-800 font-semibold tracking-tight">
          kindness feed
        </Link>
        <div className="flex items-center gap-3 text-sm">
          {user ? (
            <>
              <Link
                href="/post"
                className="bg-stone-800 text-white px-4 py-1.5 rounded-full hover:bg-stone-700 transition-colors"
              >
                + share
              </Link>
              <button
                onClick={signOut}
                className="text-stone-400 hover:text-stone-600 transition-colors"
              >
                sign out
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="text-stone-500 hover:text-stone-800 transition-colors"
            >
              sign in
            </Link>
          )}
        </div>
      </nav>
    </header>
  )
}
