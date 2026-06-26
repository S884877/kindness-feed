'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error: err } = await supabase.auth.signUp({ email, password })
    if (err) {
      setError(err.message.toLowerCase())
      setLoading(false)
      return
    }
    router.push('/')
    router.refresh()
  }

  const fieldCls =
    'w-full border border-[var(--line)] rounded-2xl px-4 py-3.5 text-[var(--ink)] bg-[#fffdf9] placeholder:text-[var(--ink-faint)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40 focus:border-[var(--accent)]/40 transition text-[15px]'

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <h1 className="font-serif text-3xl text-[var(--ink)] mb-2">create an account</h1>
        <p className="text-[var(--ink-faint)] text-sm mb-8">save moments that move you</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            required
            placeholder="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={fieldCls}
          />
          <input
            type="password"
            required
            placeholder="password"
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={fieldCls}
          />
          {error && <p className="text-[var(--accent)] text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="press text-white font-semibold py-3.5 rounded-2xl text-[15px] disabled:opacity-40 mt-1"
            style={{ background: 'linear-gradient(135deg, #cf7152, #b85a3e)' }}
          >
            {loading ? 'creating account...' : 'sign up'}
          </button>
        </form>

        <p className="text-center text-[var(--ink-faint)] text-sm mt-6">
          already have an account?{' '}
          <Link href="/login" className="text-[var(--accent)] hover:underline">
            sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
