'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSession } from '@/lib/session'

function toIndianNumber(n: number): string {
  const s = Math.round(n).toString()
  if (s.length <= 3) return s
  const last3 = s.slice(-3)
  const rest = s.slice(0, s.length - 3)
  const restFormatted = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',')
  return `${restFormatted},${last3}`
}

export default function MillionCounter({ total, goal }: { total: number; goal: number }) {
  const [barWidth, setBarWidth] = useState(0)
  const router = useRouter()

  useEffect(() => {
    const pct = Math.min((total / goal) * 100, 100)
    const t = setTimeout(() => setBarWidth(pct), 80)
    return () => clearTimeout(t)
  }, [total, goal])

  function handleStartChain() {
    if (getSession()) {
      router.push('/share')
    } else {
      router.push('/login?next=/share')
    }
  }

  return (
    <div className="px-5 py-6">
      <h1 className="font-serif text-[30px] leading-tight text-[var(--ink)] mb-10 tracking-tight">
        theonemillionkind
      </h1>

      <div className="mb-10">
        <p className="text-[12px] font-medium text-[var(--ink-faint)] uppercase tracking-[0.08em] mb-3">
          acts of kindness this week
        </p>
        <p className="font-serif text-[36px] leading-none text-[var(--ink)] mb-1">
          {toIndianNumber(total)}
          <span className="text-[22px] text-[var(--ink-faint)] ml-2">/ {toIndianNumber(goal)}</span>
        </p>
        <p className="text-[12px] text-[var(--ink-faint)] mb-5">
          {((total / goal) * 100).toFixed(2)}% of the goal
        </p>
        <div
          className="h-2.5 w-full rounded-full overflow-hidden"
          style={{ background: '#e4d8cc' }}
        >
          <div
            className="h-full rounded-full"
            style={{
              width: `${barWidth}%`,
              background: 'linear-gradient(90deg, #cf7152, #c2674c)',
              transition: 'width 1.2s cubic-bezier(0.22, 1, 0.36, 1)',
            }}
          />
        </div>
      </div>

      <p className="font-serif text-[19px] leading-[1.6] text-[var(--ink-soft)] mb-10">
        pay it forward, one kind act at a time.
      </p>

      <div className="font-serif text-[17px] leading-[1.75] text-[var(--ink)] mb-12 flex flex-col gap-5">
        <p>post an act of kindness. get a link. share it with your friends.</p>
        <p>
          whoever joins through your link becomes part of your chain, and their link starts a new branch.
          1,000,000 acts a week, one chain at a time.
        </p>
        <p>together, let's make the world a little kinder than we found it. let's go.</p>
      </div>

      <button
        onClick={handleStartChain}
        className="press text-white font-semibold px-8 py-4 rounded-full text-[15px] active:scale-95 transition-transform"
        style={{
          background: 'linear-gradient(135deg, #cf7152, #b85a3e)',
          boxShadow: '0 4px 20px -4px rgba(184,90,62,0.5)',
        }}
      >
        start a chain
      </button>
    </div>
  )
}
