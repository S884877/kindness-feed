'use client'

import { useState } from 'react'
import { Moment } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { renderMomentImage } from '@/lib/shareImage'
import type { Session } from '@/lib/session'

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} minute${mins === 1 ? '' : 's'} ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days} days ago`
  const weeks = Math.floor(days / 7)
  if (weeks < 5) return `${weeks} week${weeks === 1 ? '' : 's'} ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months} month${months === 1 ? '' : 's'} ago`
  const years = Math.floor(days / 365)
  return `${years} year${years === 1 ? '' : 's'} ago`
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
  session,
  initialSaved = false,
  onSaveToggle,
  onAuthRequired,
  showMineActions = false,
  onEdit,
  onDelete,
}: {
  moment: Moment
  index?: number
  session: Session | null
  initialSaved?: boolean
  onSaveToggle?: (id: string, saved: boolean) => void
  onAuthRequired?: () => void
  showMineActions?: boolean
  onEdit?: (moment: Moment) => void
  onDelete?: (id: string) => void
}) {
  const [copied, setCopied] = useState(false)
  const [sharing, setSharing] = useState(false)
  const [saved, setSaved] = useState(initialSaved)
  const [saveBusy, setSaveBusy] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleSave() {
    if (!session) { onAuthRequired?.(); return }
    if (saveBusy) return
    setSaveBusy(true)
    const supabase = createClient()
    if (saved) {
      const { error } = await supabase.from('saved_moments').delete().eq('user_id', session.id).eq('moment_id', moment.id)
      if (error) console.error('unsave error:', error)
      setSaved(false)
      onSaveToggle?.(moment.id, false)
    } else {
      const { error } = await supabase.from('saved_moments').insert({ user_id: session.id, moment_id: moment.id })
      if (error) console.error('save error:', error)
      setSaved(true)
      onSaveToggle?.(moment.id, true)
    }
    setSaveBusy(false)
  }

  async function share() {
    if (!session) { onAuthRequired?.(); return }
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

  async function handleDelete() {
    setDeleting(true)
    const supabase = createClient()
    const { error } = await supabase.from('moments').delete().eq('id', moment.id)
    if (error) console.error('delete error:', error)
    onDelete?.(moment.id)
  }

  return (
    <article
      className="moment-card rise-in overflow-hidden"
      style={{ animationDelay: `${Math.min(index, 8) * 70}ms` }}
    >
      <div className="px-7 pt-6 pb-5">
        <div className="flex items-center justify-end mb-5">
          <span className="text-xs text-[var(--ink-faint)]">{relativeTime(moment.created_at)}</span>
        </div>

        <p className="font-serif text-[22px] leading-[1.4] text-[var(--ink)] mb-4">
          {moment.kindness}
        </p>

        <p className="font-serif italic text-[17px] leading-[1.55] text-[var(--ink-soft)]">
          {moment.feeling}
        </p>

        {moment.image_url && (
          <div className="mt-5 -mx-7">
            <img
              src={moment.image_url}
              alt=""
              className="w-full object-cover"
              style={{ maxHeight: '300px' }}
            />
          </div>
        )}
      </div>

      {/* main action bar */}
      <div className="px-7 py-4 border-t border-[var(--line)] flex items-center justify-between gap-3">
        <button
          onClick={handleSave}
          disabled={saveBusy}
          className="press flex items-center gap-2 text-[13px] font-medium rounded-full px-4 py-2 transition-colors disabled:opacity-60"
          style={saved ? { color: 'var(--accent)', backgroundColor: '#f3e7df' } : { color: 'var(--ink-soft)' }}
        >
          {saved ? <HeartFilled /> : <HeartOutline />}
          <span>hold onto this</span>
        </button>

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

      {/* mine-only edit / delete row */}
      {showMineActions && (
        <div className="px-7 py-3 border-t border-[var(--line)] flex items-center gap-4">
          {confirmDelete ? (
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-[13px] text-[var(--ink-soft)]">are you sure? this can't be undone</span>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="text-[13px] font-medium text-[var(--accent)] hover:underline disabled:opacity-50"
              >
                {deleting ? 'deleting…' : 'yes, delete'}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-[13px] text-[var(--ink-faint)] hover:text-[var(--ink)]"
              >
                cancel
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={() => onEdit?.(moment)}
                className="text-[13px] text-[var(--ink-faint)] hover:text-[var(--ink)] transition-colors"
              >
                edit
              </button>
              <button
                onClick={() => setConfirmDelete(true)}
                className="text-[13px] text-[var(--ink-faint)] hover:text-[var(--accent)] transition-colors"
              >
                delete
              </button>
            </>
          )}
        </div>
      )}
    </article>
  )
}
