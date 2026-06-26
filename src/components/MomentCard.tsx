'use client'

import { useState, useEffect } from 'react'
import { Moment } from '@/lib/types'
import { MOODS, isMood } from '@/lib/moods'
import { createClient } from '@/lib/supabase/client'
import { renderMomentImage, attribution } from '@/lib/shareImage'

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  const day = d.getDate()
  const month = d.toLocaleString('en-GB', { month: 'short' }).toLowerCase()
  const year = d.getFullYear()
  const time = d.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase()
  return `${day} ${month} ${year}, ${time}`
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

export default function MomentCard({ moment, index = 0 }: { moment: Moment; index?: number }) {
  const [copied, setCopied] = useState(false)
  const [sharing, setSharing] = useState(false)
  const [count, setCount] = useState(moment.me_too_count ?? 0)
  const [meToo, setMeToo] = useState(false)
  const [pop, setPop] = useState(false)
  const [busy, setBusy] = useState(false)

  // hydrate me-too state from localStorage after mount (avoids SSR mismatch)
  useEffect(() => {
    if (localStorage.getItem(`metoo:${moment.id}`)) setMeToo(true)
  }, [moment.id])

  async function handleMeToo() {
    if (busy || meToo) return
    const key = `metoo:${moment.id}`
    if (localStorage.getItem(key)) {
      setMeToo(true)
      return
    }
    setBusy(true)
    setMeToo(true)
    setPop(true)
    setCount((c) => c + 1)
    setTimeout(() => setPop(false), 450)
    try {
      localStorage.setItem(key, '1')
    } catch {}
    const supabase = createClient()
    const { error } = await supabase.rpc('increment_me_too', { moment_id: moment.id })
    if (error) {
      // fallback: direct update if the rpc isn't installed
      await supabase
        .from('moments')
        .update({ me_too_count: count + 1 })
        .eq('id', moment.id)
    }
    setBusy(false)
  }

  async function share() {
    const url = `${window.location.origin}/m/${moment.id}`

    // 1) always copy the direct link + toast
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {}

    // 2) generate the beautiful shareable image
    setSharing(true)
    try {
      const blob = await renderMomentImage(moment)
      const file = new File([blob], 'kindness-moment.png', { type: 'image/png' })

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'the kindness project' })
      } else {
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = 'kindness-moment.png'
        link.click()
        setTimeout(() => URL.revokeObjectURL(link.href), 1000)
      }
    } catch {
      // sharing cancelled or failed — link is already copied, no-op
    }
    setSharing(false)
  }

  const mood = isMood(moment.mood) ? MOODS[moment.mood] : null
  const alreadyMeToo = meToo

  return (
    <article
      className="moment-card rise-in overflow-hidden"
      style={{ animationDelay: `${Math.min(index, 8) * 70}ms` }}
    >
      <div className="px-7 pt-6 pb-5">
        {/* meta row: mood chip + date */}
        <div className="flex items-center justify-between gap-4 mb-5">
          {mood ? (
            <span
              className="text-[13px] font-medium px-3.5 py-1.5 rounded-full lowercase tracking-tight"
              style={{ backgroundColor: mood.chipBg, color: mood.chipText }}
            >
              {mood.label}
            </span>
          ) : (
            <span />
          )}
          <span className="text-xs text-[var(--ink-faint)] shrink-0">{formatDate(moment.created_at)}</span>
        </div>

        {/* kindness — serif, intimate */}
        <p className="font-serif text-[22px] leading-[1.4] text-[var(--ink)] mb-4">
          {moment.kindness}
        </p>

        {/* feeling — serif italic, muted */}
        <p className="font-serif italic text-[17px] leading-[1.55] text-[var(--ink-soft)] mb-5">
          {moment.feeling}
        </p>

        {/* attribution */}
        <p className="text-[13px] text-[var(--ink-faint)]">{attribution(moment)}</p>
      </div>

      {/* bottom bar */}
      <div className="px-7 py-4 border-t border-[var(--line)] flex items-center justify-between gap-3">
        {/* this happened to me too */}
        <button
          onClick={handleMeToo}
          disabled={alreadyMeToo}
          className={`press relative flex items-center gap-2 text-[13px] font-medium rounded-full px-4 py-2 transition-colors ${
            alreadyMeToo
              ? 'bg-[#f3e7df] text-[var(--accent)] cursor-default'
              : 'text-[var(--ink-soft)] hover:bg-[#f3ece2]'
          }`}
        >
          <span className={pop ? 'me-too-pop inline-block' : 'inline-block'}>♡</span>
          <span>this happened to me too</span>
          {count > 0 && (
            <span className={`tabular-nums font-semibold ${alreadyMeToo ? 'text-[var(--accent)]' : 'text-[var(--ink)]'}`}>
              {count}
            </span>
          )}
          {pop && (
            <span className="heart-float pointer-events-none absolute left-2 -top-1 text-[var(--accent)] text-sm">♥</span>
          )}
        </button>

        {/* send to someone you love */}
        <div className="relative">
          <button
            onClick={share}
            disabled={sharing}
            className="press flex items-center gap-1.5 text-[13px] text-[var(--ink-faint)] hover:text-[var(--ink)] transition-colors py-1 disabled:opacity-60"
          >
            <ShareIcon />
            <span>{sharing ? 'creating image…' : 'send to someone you love'}</span>
          </button>
          {copied && (
            <span className="absolute -top-9 right-0 bg-[var(--ink)] text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap shadow-md">
              link copied
            </span>
          )}
        </div>
      </div>
    </article>
  )
}
