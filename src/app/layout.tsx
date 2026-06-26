import type { Metadata } from 'next'
import './globals.css'
import NavBar from '@/components/NavBar'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'kindness feed',
  description: 'A feed of small kindnesses and how they made people feel.',
  openGraph: {
    title: 'kindness feed',
    description: 'A feed of small kindnesses and how they made people feel.',
    type: 'website',
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <html lang="en">
      <body>
        <NavBar user={user} />
        <main className="max-w-xl mx-auto px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  )
}
