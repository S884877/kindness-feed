'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getSession, type Session } from '@/lib/session'
import { trackShareClick } from '@/lib/metrics'
import { uploadChainImage, ACCEPTED_IMAGE_TYPES } from '@/lib/chainUpload'
import { chainShareUrl, type ChainAct } from '@/lib/chain'

const DRAFT_KEY = 'chain_draft'

function CameraIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  )
}

function CopyIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
}

export default function ChainForm({ parentToken }: { parentToken?: string }) {
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const [actText, setActText] = useState('')
  const [feelingText, setFeelingText] = useState('')
  const [locationText, setLocationText] = useState('')
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<ChainAct | null>(null)
  const [globalCount, setGlobalCount] = useState<number | null>(null)
  const [copied, setCopied] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    setSession(getSession())
  }, [])

  useEffect(() => {
    const raw = sessionStorage.getItem(DRAFT_KEY)
    if (!raw) return
    try {
      const draft = JSON.parse(raw)
      if (draft.parentToken === (parentToken ?? null)) {
        setActText(draft.actText ?? '')
        setFeelingText(draft.feelingText ?? '')
        setLocationText(draft.locationText ?? '')
      }
      sessionStorage.removeItem(DRAFT_KEY)
    } catch {}
  }, [parentToken])

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setPhoto(f)
    const url = URL.createObjectURL(f)
    setPhotoPreview(url)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!actText.trim() || !session) return

    setLoading(true)
    setError('')
    try {
      let image_url: string | null = null
      if (photo) image_url = await uploadChainImage(photo)

      const res = await fetch('/api/chain/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: session.id,
          act_text: actText,
          feeling_text: feelingText,
          location_text: locationText,
          image_url,
          parent_share_token: parentToken || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'something went wrong')
      setResult(data.entry as ChainAct)
      setGlobalCount(typeof data.global_count === 'number' ? data.global_count : null)
    } catch (err: any) {
      setError(err.message || 'something went wrong. try again.')
    }
    setLoading(false)
  }

  const fieldCls = 'w-full border border-[var(--line)] rounded-2xl px-4 py-3.5 text-[var(--ink)] bg-[#fffdf9] placeholder:text-[var(--ink-faint)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40 focus:border-[var(--accent)]/40 transition text-[15px] leading-relaxed'
  const labelCls = 'block text-[11px] font-semibold text-[var(--ink-faint)] uppercase tracking-[0.08em] mb-2.5'

  // still checking localStorage on mount — avoid a flash of the sign-in gate
  if (session === undefined) return null

  if (!session) {
    function saveDraftAndGo() {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify({
        parentToken: parentToken ?? null,
        actText, feelingText, locationText,
      }))
    }
    const next = parentToken ? `/?ref=${parentToken}` : '/'
    return (
      <div className="text-center py-6">
        <p className="font-serif text-[19px] leading-[1.6] text-[var(--ink)] mb-2">
          sign in to add your link to this chain.
        </p>
        <p className="text-[14px] text-[var(--ink-faint)] mb-7">
          it only takes a minute — and it's how we let you know when your chain grows.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href={`/login?next=${encodeURIComponent(next)}`}
            onClick={saveDraftAndGo}
            className="press text-white font-semibold px-6 py-3 rounded-full text-[14px]"
            style={{ background: 'linear-gradient(135deg, #cf7152, #b85a3e)' }}
          >
            sign in
          </Link>
          <Link
            href={`/signup?next=${encodeURIComponent(next)}`}
            onClick={saveDraftAndGo}
            className="press text-[var(--accent)] font-semibold px-6 py-3 rounded-full text-[14px] border border-[var(--accent)]/30"
          >
            create account
          </Link>
        </div>
      </div>
    )
  }

  if (result) {
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const shareUrl = chainShareUrl(origin, result.share_token)
    const message = `i just added a link to a kindness chain. keep it going: ${shareUrl}`

    async function copyLink() {
      try {
        await navigator.clipboard.writeText(shareUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2500)
      } catch {}
    }

    return (
      <div className="flex flex-col items-center text-center px-2 py-4">
        <p className="font-serif text-[24px] leading-[1.5] text-[var(--ink)] mb-2">
          {globalCount
            ? `you're #${globalCount.toLocaleString()} in the kindness chain.`
            : `you're person ${result.depth} in this chain.`} 🤍
        </p>
        <p className="font-serif text-[17px] leading-[1.6] text-[var(--ink-soft)] mb-3">
          {result.depth === 1
            ? "and you just started a brand new chain — share your link to keep it going."
            : 'share your link to keep it going — every person who posts through it becomes the next link.'}
        </p>
        <p className="text-[13px] leading-[1.6] text-[var(--ink-faint)] mb-8 max-w-xs">
          share it with 2 people. they each share it with 2 more. just 20 rounds of that and we're past 1,000,000.
        </p>

        <div className="w-full bg-[#f7f0e8] rounded-2xl px-5 py-4 mb-6 flex items-center justify-between gap-3">
          <span className="text-[13px] text-[var(--ink-soft)] truncate">{shareUrl}</span>
          <button onClick={copyLink} className="press flex items-center gap-1.5 text-[12px] font-semibold text-[var(--accent)] shrink-0">
            <CopyIcon /> {copied ? 'copied' : 'copy'}
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
          <a
            href={`https://wa.me/?text=${encodeURIComponent(message)}`}
            target="_blank" rel="noopener noreferrer"
            onClick={() => session && trackShareClick(session.id, result.id, 'whatsapp')}
            className="press text-white font-semibold px-5 py-3 rounded-full text-[14px]"
            style={{ background: '#25D366' }}
          >
            whatsapp
          </a>
          <a
            href={`mailto:?subject=${encodeURIComponent('keep this kindness chain going')}&body=${encodeURIComponent(message)}`}
            onClick={() => session && trackShareClick(session.id, result.id, 'email')}
            className="press text-white font-semibold px-5 py-3 rounded-full text-[14px]"
            style={{ background: 'linear-gradient(135deg, #cf7152, #b85a3e)' }}
          >
            email
          </a>
          <a
            href={`sms:?body=${encodeURIComponent(message)}`}
            onClick={() => session && trackShareClick(session.id, result.id, 'sms')}
            className="press text-white font-semibold px-5 py-3 rounded-full text-[14px]"
            style={{ background: '#6b5a4e' }}
          >
            sms
          </a>
        </div>

        <p className="text-[13px] text-[var(--ink-faint)] mb-2">
          want to post it on instagram? paste the link in your bio or DM it — there's no clean web share button for that one.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div>
        <label className={labelCls}>what kindness act did you do today?</label>
        <textarea
          value={actText}
          onChange={(e) => setActText(e.target.value)}
          rows={4}
          required
          placeholder="i noticed my neighbor's bins were still out and brought them in..."
          className={`${fieldCls} resize-none font-serif`}
        />
      </div>

      <div>
        <label className={labelCls}>photo (optional)</label>
        <input
          ref={fileInput}
          type="file"
          accept={ACCEPTED_IMAGE_TYPES}
          onChange={handlePhoto}
          className="hidden"
        />
        {photoPreview ? (
          <div className="relative">
            <img src={photoPreview} alt="" className="w-full rounded-2xl object-cover" style={{ maxHeight: 220 }} />
            <button
              type="button"
              onClick={() => { setPhoto(null); setPhotoPreview(null); if (fileInput.current) fileInput.current.value = '' }}
              className="absolute top-2 right-2 bg-[#2c2620]/70 text-white text-xs px-3 py-1.5 rounded-full"
            >
              remove
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            className="press flex items-center justify-center gap-2 w-full border border-dashed border-[var(--line)] rounded-2xl py-6 text-[var(--ink-faint)] text-[14px]"
          >
            <CameraIcon /> add a photo
          </button>
        )}
      </div>

      {error && <p className="text-[var(--accent)] text-[13px]">{error}</p>}

      <button
        type="submit"
        disabled={loading || !actText.trim()}
        className="press text-white font-semibold py-3.5 rounded-2xl transition-all text-[15px] disabled:opacity-40 mt-2"
        style={{ background: 'linear-gradient(135deg, #cf7152, #b85a3e)' }}
      >
        {loading ? 'sharing...' : 'add my link to the chain'}
      </button>
    </form>
  )
}
