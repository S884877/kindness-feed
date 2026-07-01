'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { getSession } from '@/lib/session'
import { trackFormStarted, trackFormCompleted } from '@/lib/metrics'

interface NominatimResult {
  place_id: number
  display_name: string
  address: {
    city?: string
    town?: string
    village?: string
    hamlet?: string
    county?: string
    state?: string
    country?: string
  }
}

function cityLabel(r: NominatimResult): string {
  const place = r.address.city || r.address.town || r.address.village || r.address.hamlet || r.display_name.split(',')[0]
  const region = r.address.state || r.address.county || ''
  const country = r.address.country || ''
  return [place, region, country].filter(Boolean).join(', ')
}

function LocationInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [query, setQuery] = useState(value)
  const [results, setResults] = useState<NominatimResult[]>([])
  const [open, setOpen] = useState(false)
  const [fetching, setFetching] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wrapper = useRef<HTMLDivElement>(null)

  const fieldCls = 'w-full border border-[var(--line)] rounded-2xl px-4 py-3.5 text-[var(--ink)] bg-[#fffdf9] placeholder:text-[var(--ink-faint)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40 focus:border-[var(--accent)]/40 transition text-[15px] leading-relaxed'

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (wrapper.current && !wrapper.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value
    setQuery(q)
    onChange('')
    if (timer.current) clearTimeout(timer.current)
    if (q.trim().length < 2) { setResults([]); setOpen(false); return }
    timer.current = setTimeout(async () => {
      setFetching(true)
      try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&addressdetails=1&limit=6&featuretype=settlement`
        const res = await fetch(url, { headers: { 'Accept-Language': 'en' } })
        const data: NominatimResult[] = await res.json()
        setResults(data)
        setOpen(data.length > 0)
      } catch {}
      setFetching(false)
    }, 400)
  }

  function pick(r: NominatimResult) {
    const label = cityLabel(r)
    setQuery(label)
    onChange(label)
    setResults([])
    setOpen(false)
  }

  return (
    <div ref={wrapper} className="relative">
      <input
        type="text"
        value={query}
        onChange={handleChange}
        onFocus={() => results.length > 0 && setOpen(true)}
        required
        placeholder="start typing your city, town or village…"
        className={fieldCls}
        autoComplete="off"
      />
      {fetching && (
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[12px] text-[var(--ink-faint)]">searching…</span>
      )}
      {open && (
        <ul className="absolute z-20 mt-1 w-full bg-[#fffdf9] border border-[var(--line)] rounded-2xl shadow-lg overflow-hidden">
          {results.map((r) => (
            <li key={r.place_id}>
              <button
                type="button"
                onMouseDown={() => pick(r)}
                className="w-full text-left px-4 py-3 text-[14px] text-[var(--ink)] hover:bg-[#f3ece2] transition-colors leading-snug"
              >
                {cityLabel(r)}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

const MAX_KINDNESS_WORDS = 200
const MAX_FEELING_WORDS = 100

function countWords(text: string): number {
  return text.trim() === '' ? 0 : text.trim().split(/\s+/).length
}

function limitWords(text: string, max: number): string {
  const words = text.split(/(\s+)/)
  let count = 0
  let result = ''
  for (const token of words) {
    if (/\S/.test(token)) {
      if (count >= max) break
      count++
    }
    result += token
  }
  return result
}

function randomUsername() {
  const digits = Math.floor(1000 + Math.random() * 9000)
  return `kinduser_${digits}`
}

function ShareIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  )
}

export default function SharePage() {
  const [kindness, setKindness] = useState('')
  const [feeling, setFeeling] = useState('')
  const [location, setLocation] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [copied, setCopied] = useState(false)
  const [formEventId, setFormEventId] = useState<string | undefined>()
  const [invitedByUserId, setInvitedByUserId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const session = getSession()
    if (!session) { router.replace('/login'); return }
    trackFormStarted(session.id).then(setFormEventId)

    const chainRef = sessionStorage.getItem('chain_ref')
    if (chainRef) {
      setInvitedByUserId(chainRef)
      sessionStorage.removeItem('chain_ref')
    }
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!kindness.trim() || !feeling.trim()) return
    setLoading(true)
    setError('')

    const session = getSession()
    const supabase = createClient()

    const insert: Record<string, unknown> = {
      kindness: kindness.trim(),
      feeling: feeling.trim(),
      posted_by: randomUsername(),
      location: location.trim() || null,
    }
    if (session?.id) insert.user_id = session.id

    if (invitedByUserId) {
      const { data: parentMoment } = await supabase
        .from('moments')
        .select('id, chain_id')
        .eq('user_id', invitedByUserId)
        .not('chain_id', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (parentMoment) {
        insert.chain_id = parentMoment.chain_id
        insert.parent_moment_id = parentMoment.id
        insert.invited_by_user_id = invitedByUserId
      } else {
        insert.chain_id = crypto.randomUUID()
      }
    } else {
      insert.chain_id = crypto.randomUUID()
    }

    const { error: err } = await supabase.from('moments').insert(insert)
    if (err) {
      console.error('insert error:', err)
      setError(err.message || 'something went wrong. try again.')
      setLoading(false)
      return
    }

    if (formEventId) trackFormCompleted(formEventId)
    router.refresh()
    setLoading(false)
    setSubmitted(true)
  }

  async function handleShare() {
    try {
      await navigator.clipboard.writeText(window.location.origin)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {}
  }

  if (submitted) {
    return (
      <div className="feed-frame px-5 flex flex-col items-center justify-center text-center" style={{ minHeight: '55vh' }}>
        <p className="font-serif text-[24px] leading-[1.5] text-[var(--ink)] mb-2">
          your moment is on the wall. 🤍
        </p>
        <p className="font-serif text-[18px] leading-[1.6] text-[var(--ink-soft)] mb-10">
          feel free to share it.
        </p>

        <div className="relative">
          <button
            onClick={handleShare}
            className="press flex items-center gap-2 text-white font-semibold px-6 py-3.5 rounded-full text-[15px]"
            style={{ background: 'linear-gradient(135deg, #cf7152, #b85a3e)' }}
          >
            <ShareIcon />
            share
          </button>
          {copied && (
            <span
              className="absolute -top-10 left-1/2 -translate-x-1/2 bg-[var(--ink)] text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap"
              style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
            >
              link copied
            </span>
          )}
        </div>

        <Link
          href="/"
          className="mt-6 text-sm text-[var(--ink-faint)] hover:text-[var(--ink)] transition-colors"
        >
          back to the wall
        </Link>
      </div>
    )
  }

  const fieldCls = 'w-full border border-[var(--line)] rounded-2xl px-4 py-3.5 text-[var(--ink)] bg-[#fffdf9] placeholder:text-[var(--ink-faint)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40 focus:border-[var(--accent)]/40 transition text-[15px] leading-relaxed'
  const labelCls = 'block text-[11px] font-semibold text-[var(--ink-faint)] uppercase tracking-[0.08em] mb-2.5'

  return (
    <div className="feed-frame px-5">
      <p className="font-serif text-[22px] leading-[1.4] text-[var(--ink)] mb-5">
        what's something kind that you did today?
      </p>

      <p className="text-[13px] leading-[1.6] text-[var(--ink-faint)] mb-8 bg-[#f7f0e8] rounded-xl px-4 py-3">
        we encourage you not to use AI to write this. it's fine if it has mistakes. your post is anonymous. no one's gonna judge you.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div>
          <textarea
            value={kindness}
            onChange={(e) => setKindness(limitWords(e.target.value, MAX_KINDNESS_WORDS))}
            rows={5}
            placeholder="a stranger held the door open even though i was far away..."
            required
            autoFocus
            className={`${fieldCls} resize-none font-serif`}
          />
          {(() => {
            const wc = countWords(kindness)
            return (
              <p className="text-right text-[11px] mt-1.5" style={{ color: wc >= MAX_KINDNESS_WORDS ? 'var(--accent)' : 'rgba(168,156,143,0.7)' }}>
                {wc} / {MAX_KINDNESS_WORDS}
              </p>
            )
          })()}
        </div>

        <div>
          <label className={labelCls}>how did it make you feel?</label>
          <textarea
            value={feeling}
            onChange={(e) => setFeeling(limitWords(e.target.value, MAX_FEELING_WORDS))}
            rows={5}
            placeholder="like i wasn't invisible. like i mattered for just a moment..."
            required
            className={`${fieldCls} resize-none font-serif italic`}
          />
          {(() => {
            const wc = countWords(feeling)
            return (
              <p className="text-right text-[11px] mt-1.5" style={{ color: wc >= MAX_FEELING_WORDS ? 'var(--accent)' : 'rgba(168,156,143,0.7)' }}>
                {wc} / {MAX_FEELING_WORDS}
              </p>
            )
          })()}
        </div>

        <div>
          <label className={labelCls}>where from?</label>
          <LocationInput value={location} onChange={setLocation} />
        </div>

        {error && <p className="text-[var(--accent)] text-[13px]">{error}</p>}

        <button
          type="submit"
          disabled={loading || !kindness.trim() || !feeling.trim() || !location.trim()}
          className="press text-white font-semibold py-3.5 rounded-2xl transition-all text-[15px] disabled:opacity-40 mt-2"
          style={{ background: 'linear-gradient(135deg, #cf7152, #b85a3e)' }}
        >
          {loading ? 'sharing...' : 'share this moment'}
        </button>
      </form>
    </div>
  )
}
