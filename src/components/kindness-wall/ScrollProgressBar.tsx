'use client'

import { useEffect, useState } from 'react'

export default function ScrollProgressBar() {
  const [progress, setProgress] = useState(0)
  const [scrollable, setScrollable] = useState(false)

  useEffect(() => {
    let ticking = false

    function measure() {
      const doc = document.documentElement
      const scrollableHeight = doc.scrollHeight - doc.clientHeight
      setScrollable(scrollableHeight > 40)
      if (scrollableHeight <= 0) {
        setProgress(0)
        return
      }
      const pct = (window.scrollY / scrollableHeight) * 100
      setProgress(Math.min(100, Math.max(0, pct)))
    }

    function onScroll() {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        measure()
        ticking = false
      })
    }

    measure()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  if (!scrollable) return null

  return (
    <div
      className="fixed bottom-5 left-1/2 z-40 h-[2px] w-40 -translate-x-1/2 overflow-hidden rounded-full"
      style={{ background: 'rgba(255,255,255,0.15)' }}
    >
      <div
        className="h-full rounded-full"
        style={{ width: `${progress}%`, background: '#ffffff', transition: 'width 0.1s linear' }}
      />
    </div>
  )
}
