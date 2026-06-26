'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Moment } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { renderMomentImage } from '@/lib/shareImage'
import type { User } from '@supabase/supabase-js'

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  const day = d.getDate()
  const month = d.toLocaleString('en-GB', { month: 'short' }).toLowerCase()
  const year = d.getFullYear()
  const time = d.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase()
  return `${day} ${month} ${year}, ${time}`
}

function HeartOutline() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )
}

function HeartFilled() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )
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

export default function MomentCard({
  moment,
  index = 0,
  user,
  initialSaved = false,
  onSaveToggle,
}: {
  moment: Moment
  index?: number
  user: User | null
  initialSaved?: boolean
  onSaveToggle?: (id: string, saved: boolean) => void
}) {
  const [copied, setCopied] = useState(false)
  const [sharing, setSharing] = useState(false)
  const [saved, setSaved] = useState(initialSaved)
  const [saveBusy, setSaveBusy] = useState(false)
  const router = useRouter()

  async function handleSave() {
    if (!user) {
      router.push('/login')
      return
    }
    if (saveBusy) return
    setSaveBusy(true)
    const supabase = createClient()
    if (saved) {
      await supabase
        .from('saved_moments')
        .delete()
        .eq('user_id', user.id)
        .eq('moment_id', moment.id)
      setSaved(false)
      onSaveToggle?.(moment.id, false)
    } else {
      await supabase
        .from('saved_moments')
        .insert({ user_id: user.id, moment_id: moment.id })
      setSaved(true)
      onSaveToggle?.(moment.id, true)
    }
    setSaveBusy(false)
  }

  async function share() {
    const url = `${window.location.origin}/m/${moment.id}`
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {}

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
    } catch {}
    setSharing(false)
  }

  return (
    <article
      className="moment-card rise-in overflow-hidden"
      style={{ animationDelay: `${Math.min(index, 8) * 70}ms` }}
    >
      <div className="px-7 pt-6 pb-5">
        <div className="flex items-center justify-end mb-5">
          <span className="text-xs text-[var(--ink-faint)]">{formatDate(moment.created_at)}</span>
        </div>

        <p className="font-serif text-[22px] leading-[1.4] text-[var(--ink)] mb-4">
          {moment.kindness}
        </p>

        <p className="font-serif italic text-[17px] leading-[1.55] text-[var(--ink-soft)]">
          {moment.feeling}
        </p>
      </div>

      <div className="px-7 py-4 border-t border-[var(--line)] flex items-center justify-between gap-3">
        {/* hold onto this */}
        <button
          onClick={handleSave}
          disabled={saveBusy}
          className="press flex items-center gap-2 text-[13px] font-medium rounded-full px-4 py-2 transition-colors disabled:opacity-60"
          style={
            saved
              ? { color: 'var(--accent)', backgroundColor: '#f3e7df' }
              : { color: 'var(--ink-soft)' }
          }
        >
          {saved ? <HeartFilled /> : <HeartOutline />}
          <span>hold onto this</span>
        </button>

        {/* pass it on */}
        <div className="relative">
          <button
            onClick={share}
            disabled={sharing}
            className="press flex items-center gap-1.5 text-[13px] text-[var(--ink-faint)] hover:text-[var(--ink)] transition-colors py-1 disabled:opacity-60"
          >
            <ShareIcon />
            <span>{sharing ? 'creating image…' : 'pass it on'}</span>
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
