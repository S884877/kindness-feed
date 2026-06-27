import type { Metadata } from 'next'
import { Fraunces, Inter } from 'next/font/google'
import './globals.css'
import NavBar from '@/components/NavBar'

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
  axes: ['opsz', 'SOFT', 'WONK'],
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'the kindness project',
  description: 'small moments of kindness and how they made people feel.',
  icons: [],
  openGraph: {
    title: 'the kindness project',
    description: 'small moments of kindness and how they made people feel.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable}`}>
      <body>
        <NavBar />
        <main className="pt-24 pb-36">
          <div className="feed-frame">
            {children}
          </div>
        </main>
      </body>
    </html>
  )
}
