import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import MomentCard from '@/components/MomentCard'
import { Moment } from '@/lib/types'
import type { Metadata } from 'next'

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('moments')
    .select('kindness, feeling')
    .eq('id', id)
    .single()

  if (!data) return { title: 'kindness feed' }

  return {
    title: data.kindness.slice(0, 60),
    description: data.feeling.slice(0, 120),
    openGraph: {
      title: data.kindness.slice(0, 60),
      description: data.feeling.slice(0, 120),
      type: 'article',
    },
    twitter: {
      card: 'summary',
      title: data.kindness.slice(0, 60),
      description: data.feeling.slice(0, 120),
    },
  }
}

export default async function MomentPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data } = await supabase
    .from('moments')
    .select('id, kindness, feeling, location, first_name, mood, me_too_count, created_at')
    .eq('id', id)
    .single()

  if (!data) notFound()

  const moment: Moment = data as Moment

  return (
    <div className="py-4">
      <MomentCard moment={moment} />
      <p className="text-center text-stone-300 text-xs mt-8">
        <a href="/" className="hover:text-stone-500 transition-colors">← back to the feed</a>
      </p>
    </div>
  )
}
