'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { saveSession } from '@/lib/session'
import Link from 'next/link'

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupForm />
    </Suspense>
  )
}

const COUNTRY_CODES = [
  { code: '+1', label: 'US/CA +1' },
  { code: '+44', label: 'UK +44' },
  { code: '+91', label: 'IN +91' },
  { code: '+61', label: 'AU +61' },
  { code: '+971', label: 'UAE +971' },
  { code: '+65', label: 'SG +65' },
]

function SignupForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [countryCode, setCountryCode] = useState('+1')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        phone_country_code: countryCode,
        phone_number: phoneNumber,
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error || 'something went wrong. try again.')
      setLoading(false)
      return
    }
    saveSession({ id: data.id, email: data.email })
    router.push(next || '/')
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
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={fieldCls}
          />
          <div className="flex gap-2">
            <select
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              className={`${fieldCls} w-auto`}
            >
              {COUNTRY_CODES.map((c) => (
                <option key={c.code} value={c.code}>{c.label}</option>
              ))}
            </select>
            <input
              type="tel"
              required
              placeholder="phone number"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
              className={fieldCls}
            />
          </div>
          {error && <p className="text-[var(--accent)] text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="press text-white font-semibold py-3.5 rounded-2xl text-[15px] disabled:opacity-40 mt-1"
            style={{ background: 'linear-gradient(135deg, #cf7152, #b85a3e)' }}
          >
            {loading ? 'creating account...' : 'create account'}
          </button>
        </form>

        <p className="text-center text-[var(--ink-faint)] text-sm mt-6">
          already have an account?{' '}
          <Link href={next ? `/login?next=${encodeURIComponent(next)}` : '/login'} className="text-[var(--accent)] hover:underline">
            sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
