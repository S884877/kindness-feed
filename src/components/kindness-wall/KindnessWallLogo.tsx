'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const LIGHT_ROUTES = ['/post', '/feed']

export default function KindnessWallLogo() {
  const pathname = usePathname()
  const isLight = LIGHT_ROUTES.some((route) => pathname?.startsWith(route))

  return (
    <Link
      href="/"
      className="fixed top-5 left-5 z-40 text-[13px] font-bold lowercase tracking-tight"
      style={{ color: isLight ? '#1a1a1a' : '#ffffff' }}
    >
      the kindness wall.
    </Link>
  )
}
