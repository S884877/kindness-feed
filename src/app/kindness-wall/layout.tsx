import type { Metadata } from 'next'
import { Space_Grotesk } from 'next/font/google'
import './kindness-wall.css'
import KindnessWallLogo from '@/components/kindness-wall/KindnessWallLogo'
import ScrollProgressBar from '@/components/kindness-wall/ScrollProgressBar'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-kw-sans',
  display: 'swap',
  weight: ['400', '500', '700'],
})

export const metadata: Metadata = {
  title: 'the kindness wall.',
  description: 'a million kind acts, one at a time.',
  openGraph: {
    title: 'the kindness wall.',
    description: 'a million kind acts, one at a time.',
    type: 'website',
  },
}

export default function KindnessWallLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={spaceGrotesk.variable}>
      <body>
        <KindnessWallLogo />
        <ScrollProgressBar />
        {children}
      </body>
    </html>
  )
}
