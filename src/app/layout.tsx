import type { Metadata } from 'next'
import './globals.css'
import NavBar from '@/components/NavBar'

export const metadata: Metadata = {
  title: 'the kindness project',
  description: 'small moments of kindness and how they made people feel.',
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
    <html lang="en">
      <body>
        <NavBar />
        <main className="max-w-[680px] mx-auto px-4 pt-20 pb-24">
          {children}
        </main>
      </body>
    </html>
  )
}
