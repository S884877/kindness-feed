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
  const { data: { user } } = await supabase.auth.getUser()

  const { data } = await supabase
    .from('moments')
    .select(`
      *,
      users(id, name, avatar_url),
      reactions(type, user_id)
    `)
    .eq('id', id)
    .single()

  if (!data) notFound()

  const reacts = data.reactions ?? []
  const moment: Moment = {
    ...data,
    reaction_counts: {
      warmth: reacts.filter((r: any) => r.type === 'warmth').length,
      heart: reacts.filter((r: any) => r.type === 'heart').length,
    },
    user_reactions: {
      warmth: reacts.some((r: any) => r.type === 'warmth' && r.user_id === user?.id),
      heart: reacts.some((r: any) => r.type === 'heart' && r.user_id === user?.id),
    },
  }

  return (
    <div className="py-4">
      <MomentCard moment={moment} currentUserId={user?.id} />
      <p className="text-center text-stone-300 text-xs mt-8">
        <a href="/" className="hover:text-stone-500 transition-colors">← back to the feed</a>
      </p>
    </div>
  )
}
