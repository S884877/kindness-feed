'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const GOAL = 1_000_000
const POLL_MS = 8000

export default function ChainCounter() {
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    const supabase = createClient()
    let cancelled = false

    async function poll() {
      const { count: c } = await supabase.from('chain_acts').select('id', { count: 'exact', head: true })
      if (!cancelled) setCount(c ?? 0)
    }

    poll()
    const interval = setInterval(poll, POLL_MS)
    return () => { cancelled = true; clearInterval(interval) }
  }, [])

  const pct = count === null ? 0 : Math.min(100, (count / GOAL) * 100)

  return (
    <div className="w-full flex flex-col items-center text-center mb-2">
      <p className="font-serif text-[40px] leading-none text-[var(--ink)] tabular-nums">
        {count === null ? '—' : count.toLocaleString()}
        <span className="text-[18px] text-[var(--ink-faint)]"> / {GOAL.toLocaleString()}</span>
      </p>
      <p className="font-serif text-[14px] text-[var(--ink-faint)] mt-3 mb-4">kind acts and counting.</p>
      <div className="w-full max-w-xs h-2 rounded-full bg-[#efe4d4] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #cf7152, #b85a3e)' }}
        />
      </div>
    </div>
  )
}
