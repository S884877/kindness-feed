'use client'

import { useState } from 'react'
import { Moment } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} ${mins === 1 ? 'minute' : 'minutes'} ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} ${hrs === 1 ? 'hour' : 'hours'} ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days} ${days === 1 ? 'day' : 'days'} ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function ShareIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
      <polyline points="16 6 12 2 8 6"/>
      <line x1="12" y1="2" x2="12" y2="15"/>
    </svg>
  )
}

export default function MomentCard({ moment }: { moment: Moment }) {
  const [warmth, setWarmth] = useState(moment.warmth_count ?? 0)
  const [warmed, setWarmed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  async function toggleWarmth() {
    if (loading) return
    setLoading(true)
    const supabase = createClient()
    if (warmed) {
      setWarmth((n) => n - 1)
      setWarmed(false)
    } else {
      setWarmth((n) => n + 1)
      setWarmed(true)
      // optimistic — no auth needed, just insert anonymously
      await supabase.from('reactions').insert({
        moment_id: moment.id,
        user_id: '00000000-0000-0000-0000-000000000001',
        type: 'warmth',
      })
    }
    setLoading(false)
  }

  async function share() {
    const url = `${window.location.origin}/m/${moment.id}`
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      window.open(url, '_blank')
    }
  }

  return (
    <article className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
      <div className="px-5 pt-4 pb-3">
        {/* top bar */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-stone-700">{moment.posted_by}</span>
          <span className="text-xs text-stone-400">{timeAgo(moment.created_at)}</span>
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
      <div className="px-5 py-3 border-t border-stone-100 flex items-center justify-between">
        <button
          onClick={toggleWarmth}
          className={`flex items-center gap-1.5 text-sm font-medium transition-colors px-3 py-1.5 rounded-full ${
            warmed
              ? 'bg-amber-50 text-amber-600'
              : 'text-stone-400 hover:bg-stone-50 hover:text-amber-500'
          }`}
        >
          <span className="text-base">☀️</span>
          <span>{warmth > 0 ? warmth : ''} {warmed ? 'Warm' : 'Warmth'}</span>
        </button>

        <button
          onClick={share}
          className="flex items-center gap-1.5 text-sm text-stone-400 hover:text-stone-600 transition-colors px-3 py-1.5 rounded-full hover:bg-stone-50"
        >
          <ShareIcon />
          <span>{copied ? 'Copied!' : 'Share'}</span>
        </button>
      </div>
    </article>
  )
}
