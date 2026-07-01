'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { saveSession } from '@/lib/session'
import Link from 'next/link'

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'incorrect email or password')
        setLoading(false)
        return
      }
      saveSession({ id: data.id, email: data.email })
      router.push(next || '/')
    } catch {
      setError('something went wrong. try again.')
      setLoading(false)
    }
  }

  const fieldCls =
    'w-full border border-[var(--line)] rounded-2xl px-4 py-3.5 text-[var(--ink)] bg-[#fffdf9] placeholder:text-[var(--ink-faint)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40 focus:border-[var(--accent)]/40 transition text-[15px]'

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <h1 className="font-serif text-3xl text-[var(--ink)] mb-2">welcome back</h1>
        <p className="text-[var(--ink-faint)] text-sm mb-8">sign in to save and share moments</p>

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
            {loading ? 'signing in...' : 'sign in'}
          </button>
        </form>

        <p className="text-center text-[var(--ink-faint)] text-sm mt-6">
          don&apos;t have an account?{' '}
          <Link href={next ? `/signup?next=${encodeURIComponent(next)}` : '/signup'} className="text-[var(--accent)] hover:underline">
            sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
