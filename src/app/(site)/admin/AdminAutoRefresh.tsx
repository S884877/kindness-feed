'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminAutoRefresh({ intervalSeconds = 30 }: { intervalSeconds?: number }) {
  const router = useRouter()
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const [countdown, setCountdown] = useState(intervalSeconds)
  const countRef = useRef(intervalSeconds)

  useEffect(() => {
    const tick = setInterval(() => {
      countRef.current -= 1
      setCountdown(countRef.current)
      if (countRef.current <= 0) {
        router.refresh()
        countRef.current = intervalSeconds
        setLastRefresh(new Date())
        setCountdown(intervalSeconds)
      }
    }, 1000)
    return () => clearInterval(tick)
  }, [router, intervalSeconds])

  return (
    <span style={{ fontSize: 11, color: '#bbb' }}>
      auto-refreshes in {countdown}s · last updated {lastRefresh.toLocaleTimeString()}
    </span>
  )
}
