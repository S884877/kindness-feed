'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { KINDNESS_WALL_GOAL } from '@/lib/kindnessWall'

export default function HomeCounter() {
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('kindness_wall_posts')
      .select('id', { count: 'exact', head: true })
      .then(({ count }) => setCount(count ?? 0))
  }, [])

  return (
    <p className="kw-body text-[14px] mb-10">
      <span className="kw-headline text-[22px]" style={{ color: 'var(--kw-text)' }}>
        {count !== null ? count.toLocaleString() : '—'}
      </span>
      {' '}/ {KINDNESS_WALL_GOAL.toLocaleString()} kind acts posted so far
    </p>
  )
}
