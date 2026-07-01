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

function BookmarkOutline() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function BookmarkFilled() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
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
      fetch('/api/notify-save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moment_id: moment.id }),
      }).catch(() => {})
    }
    setSaveBusy(false)
  }

  async function share() {
    if (!session) { onAuthRequired?.(); return }
    const url = `${window.location.origin}/m/${moment.id}`
    const inviteMsg = `Someone shared an act of kindness and started a chain.\nNow it's your turn. Share something kind that you did and join the chain.\nTogether, we're building 1,000,000 acts this week. Let's go. ${url}`
    try {
      await navigator.clipboard.writeText(inviteMsg)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {}
    setSharing(true)
    try {
      const blob = await renderMomentImage(moment)
      const file = new File([blob], 'kindness-moment.png', { type: 'image/png' })
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text: inviteMsg, title: 'the kindness project' })
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
      <div className="px-7 pt-6">
        <div className="flex items-center justify-end mb-5">
          <span className="text-xs text-[var(--ink-faint)]">{relativeTime(moment.created_at)}</span>
        </div>

        <p className="font-serif text-[18px] leading-[1.4] text-[var(--ink)] mb-4">
          {moment.kindness}
        </p>

        <p className="font-serif italic text-[15px] leading-[1.55] text-[var(--ink-soft)]">
          {moment.feeling}
        </p>

        {moment.location && (
          <p className="mt-3 text-[12px] text-[var(--ink-faint)] flex items-center gap-1">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            {moment.location}
          </p>
        )}

        {moment.image_url && (
          <div className="-mx-7 mb-0">
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
          className="press flex items-center gap-2 text-[13px] font-medium rounded-full px-4 py-2 transition-all disabled:opacity-60"
          style={saved
            ? { color: '#b85a3e', backgroundColor: '#f0d5c4', border: '1.5px solid #d4835e', fontWeight: 600 }
            : { color: 'var(--ink-soft)', border: '1.5px solid transparent' }}
        >
          {saved ? <BookmarkFilled /> : <BookmarkOutline />}
          <span>save</span>
        </button>

        <div className="flex flex-col items-end gap-1">
          <button
            onClick={share}
            disabled={sharing}
            className="press flex items-center gap-1.5 text-[13px] text-[var(--ink-faint)] hover:text-[var(--ink)] transition-colors py-1 disabled:opacity-60"
          >
            <ShareIcon />
            <span>{sharing ? 'creating image…' : 'pass it on'}</span>
          </button>
          {copied && (
            <span className="text-[11px] text-[var(--ink-faint)]">link copied</span>
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
