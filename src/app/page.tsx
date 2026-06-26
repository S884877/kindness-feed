import { createClient } from '@/lib/supabase/server'
import Feed from '@/components/Feed'
import { Moment } from '@/lib/types'

const PAGE_SIZE = 10

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data } = await supabase
    .from('moments')
    .select(`
      *,
      users(id, name, avatar_url),
      reactions(type, user_id)
    `)
    .order('created_at', { ascending: false })
    .range(0, PAGE_SIZE - 1)

  const moments: Moment[] = (data ?? []).map((m: any) => {
    const reacts = m.reactions ?? []
    return {
      ...m,
      reaction_counts: {
        warmth: reacts.filter((r: any) => r.type === 'warmth').length,
        heart: reacts.filter((r: any) => r.type === 'heart').length,
      },
      user_reactions: {
        warmth: reacts.some((r: any) => r.type === 'warmth' && r.user_id === user?.id),
        heart: reacts.some((r: any) => r.type === 'heart' && r.user_id === user?.id),
      },
    }
  })

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-stone-800 mb-1">kindness feed</h1>
        <p className="text-stone-400 text-sm">small moments that meant something</p>
      </div>
      <Feed initialMoments={moments} currentUserId={user?.id} />
    </div>
  )
}
