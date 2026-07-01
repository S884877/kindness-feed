'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Moment } from '@/lib/types'

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

function LocationInput({ value, onChange, fieldCls }: { value: string; onChange: (v: string) => void; fieldCls: string }) {
  const [query, setQuery] = useState(value)
  const [results, setResults] = useState<NominatimResult[]>([])
  const [open, setOpen] = useState(false)
  const [fetching, setFetching] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wrapper = useRef<HTMLDivElement>(null)

  useEffect(() => { setQuery(value) }, [value])

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

const MAX_WORDS = 350

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

export default function PostModal({
  editMoment,
  onEditDone,
}: {
  editMoment?: Moment | null
  onEditDone?: () => void
}) {
  const [open, setOpen] = useState(false)
  const [kindness, setKindness] = useState('')
  const [feeling, setFeeling] = useState('')
  const [location, setLocation] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    if (!editMoment) return
    setKindness(editMoment.kindness)
    setFeeling(editMoment.feeling)
    setLocation(editMoment.location ?? '')
    setError('')
    setOpen(true)
  }, [editMoment])

  function closeModal() {
    if (loading) return
    setOpen(false)
    setKindness('')
    setFeeling('')
    setLocation('')
    setError('')
    onEditDone?.()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!kindness.trim() || !feeling.trim() || !editMoment) return
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error: err } = await supabase
      .from('moments')
      .update({
        kindness: kindness.trim(),
        feeling: feeling.trim(),
        location: location.trim() || null,
      })
      .eq('id', editMoment.id)

    if (err) {
      console.error('update error:', err)
      setError(err.message || 'something went wrong. try again.')
      setLoading(false)
      return
    }

    setLoading(false)
    closeModal()
    router.refresh()
  }

  if (!open) return null

  const labelCls = 'block text-[11px] font-semibold text-[var(--ink-faint)] uppercase tracking-[0.08em] mb-2.5'
  const fieldCls = 'w-full border border-[var(--line)] rounded-2xl px-4 py-3.5 text-[var(--ink)] bg-[#fffdf9] placeholder:text-[var(--ink-faint)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40 focus:border-[var(--accent)]/40 transition text-[15px] leading-relaxed'

  return (
    <div
      className="backdrop-in fixed inset-0 z-40 bg-[#2c2620]/35 backdrop-blur-md flex items-center justify-center px-4 py-8 overflow-y-auto"
      onClick={(e) => { if (e.target === e.currentTarget) closeModal() }}
    >
      <div
        className="sheet-in bg-[#fffdf9] rounded-[28px] w-full max-w-lg p-7 my-auto"
        style={{ boxShadow: '0 30px 80px -20px rgba(60,45,30,0.4), 0 8px 24px rgba(60,45,30,0.12)' }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-serif text-2xl text-[var(--ink)]">edit moment</h2>
          <button
            onClick={closeModal}
            className="press text-[var(--ink-faint)] hover:text-[var(--ink)] transition-colors text-2xl leading-none w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#f3ece2]"
            aria-label="close"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div>
            <label className={labelCls}>what's something kind that you did today?</label>
            <textarea
              value={kindness}
              onChange={(e) => setKindness(limitWords(e.target.value, MAX_WORDS))}
              rows={3}
              required
              className={`${fieldCls} resize-none font-serif`}
            />
            {(() => {
              const wc = countWords(kindness)
              return (
                <p className="text-right text-[11px] mt-1.5" style={{ color: wc >= MAX_WORDS ? 'var(--accent)' : 'rgba(168,156,143,0.7)' }}>
                  {wc} / {MAX_WORDS}
                </p>
              )
            })()}
          </div>

          <div>
            <label className={labelCls}>how did it make you feel?</label>
            <textarea
              value={feeling}
              onChange={(e) => setFeeling(limitWords(e.target.value, MAX_WORDS))}
              rows={3}
              required
              className={`${fieldCls} resize-none font-serif italic`}
            />
            {(() => {
              const wc = countWords(feeling)
              return (
                <p className="text-right text-[11px] mt-1.5" style={{ color: wc >= MAX_WORDS ? 'var(--accent)' : 'rgba(168,156,143,0.7)' }}>
                  {wc} / {MAX_WORDS}
                </p>
              )
            })()}
          </div>

          <div>
            <label className={labelCls}>where from?</label>
            <LocationInput value={location} onChange={setLocation} fieldCls={fieldCls} />
          </div>

          {error && <p className="text-[var(--accent)] text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading || !kindness.trim() || !feeling.trim() || !location.trim()}
            className="press text-white font-semibold py-3.5 rounded-2xl transition-all text-[15px] disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg, #cf7152, #b85a3e)' }}
          >
            {loading ? 'saving…' : 'save changes'}
          </button>
        </form>
      </div>
    </div>
  )
}
