'use client'

import { useState, useRef, useEffect } from 'react'
import { trackShareClick } from '@/lib/metrics'

function ShareGlyph() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.6" y1="10.6" x2="15.4" y2="6.4" />
      <line x1="8.6" y1="13.4" x2="15.4" y2="17.6" />
    </svg>
  )
}

export default function ChainShareMenu({ shareUrl, message, userId, actId }: { shareUrl: string; message: string; userId?: string; actId?: string }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [note, setNote] = useState('')
  const wrapper = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (wrapper.current && !wrapper.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function track(platform: 'whatsapp' | 'sms' | 'email' | 'instagram' | 'copy') {
    if (userId && actId) trackShareClick(userId, actId, platform)
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(message)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
      track('copy')
    } catch {}
  }

  async function nativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'the kindness wall', text: message, url: shareUrl })
        track('copy')
      } catch {}
    } else {
      copyLink()
    }
    setOpen(false)
  }

  async function shareInstagram() {
    await copyLink()
    track('instagram')
    setNote('link copied — paste it in your instagram bio or DM')
    setTimeout(() => setNote(''), 4000)
  }

  const itemCls = 'press w-full text-left px-4 py-3 text-[14px] text-[var(--ink)] hover:bg-[#f3ece2] transition-colors'

  return (
    <div ref={wrapper} className="relative inline-block">
      <button
        onClick={() => setOpen((v) => !v)}
        className="press flex items-center gap-2 text-white font-semibold px-5 py-3 rounded-full text-[14px]"
        style={{ background: 'linear-gradient(135deg, #cf7152, #b85a3e)' }}
      >
        <ShareGlyph /> pass it on
      </button>

      {open && (
        <div
          className="absolute z-30 mt-2 left-1/2 -translate-x-1/2 w-56 bg-[#fffdf9] border border-[var(--line)] rounded-2xl overflow-hidden"
          style={{ boxShadow: '0 16px 48px -12px rgba(60,45,30,0.28), 0 4px 12px rgba(60,45,30,0.08)' }}
        >
          <button onClick={nativeShare} className={itemCls}>share</button>
          <button onClick={shareInstagram} className={itemCls}>share via instagram</button>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(message)}`}
            target="_blank" rel="noopener noreferrer"
            onClick={() => { track('whatsapp'); setOpen(false) }}
            className={`${itemCls} block`}
          >
            share via whatsapp
          </a>
          <a
            href={`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(message)}`}
            target="_blank" rel="noopener noreferrer"
            onClick={() => { track('copy'); setOpen(false) }}
            className={`${itemCls} block`}
          >
            share via telegram
          </a>
          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`}
            target="_blank" rel="noopener noreferrer"
            onClick={() => { track('copy'); setOpen(false) }}
            className={`${itemCls} block`}
          >
            share via twitter
          </a>
          <button onClick={() => { copyLink(); setOpen(false) }} className={itemCls}>
            {copied ? 'copied ✓' : 'copy link'}
          </button>
        </div>
      )}

      {note && (
        <p className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-56 text-[12px] text-[var(--ink-faint)] text-center">
          {note}
        </p>
      )}
    </div>
  )
}
