'use client'

import { useState } from 'react'
import { Moment } from '@/lib/types'

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
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
      <polyline points="16 6 12 2 8 6"/>
      <line x1="12" y1="2" x2="12" y2="15"/>
    </svg>
  )
}

export default function MomentCard({ moment }: { moment: Moment }) {
  const [copied, setCopied] = useState(false)

  async function share() {
    const url = `${window.location.origin}/m/${moment.id}`
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      window.open(url, '_blank')
    }
  }

  return (
    <article className="moment-card bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
      <div className="px-5 pt-4 pb-3">
        {/* meta row: location + date */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            {moment.location && (
              <span className="text-xs text-stone-400">{moment.location}</span>
            )}
          </div>
          <span className="text-xs text-stone-400 shrink-0">{formatDate(moment.created_at)}</span>
        </div>

        {/* kindness */}
        <p className="text-stone-900 text-[15px] leading-relaxed mb-2">
          {moment.kindness}
        </p>

        {/* feeling */}
        <p className="text-stone-500 text-sm leading-relaxed">
          {moment.feeling}
        </p>
      </div>

      {/* bottom bar */}
      <div className="px-5 py-3 border-t border-stone-100 flex items-center justify-end">
        <div className="relative">
          <button
            onClick={share}
            className="flex items-center gap-1.5 text-sm text-stone-400 hover:text-stone-700 transition-colors py-1"
          >
            <ShareIcon />
            <span>send to someone you love</span>
          </button>
          {copied && (
            <span className="absolute -top-9 right-0 bg-stone-800 text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap shadow-md">
              link copied
            </span>
          )}
        </div>
      </div>
    </article>
  )
}
