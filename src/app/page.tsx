import { createClient } from '@/lib/supabase/server'
import WallClient from '@/components/WallClient'
import { Moment } from '@/lib/types'

const PAGE_SIZE = 10

export default async function Home() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('moments')
    .select('id, kindness, feeling, location, mood, image_url, created_at, posted_by, user_id, saved_moments(count)')
    .order('created_at', { ascending: false })
    .range(0, PAGE_SIZE - 1)

  if (error) console.error('SSR moments fetch error:', error)
  const sorted = ((data ?? []) as any[]).sort((a, b) => {
    const ac = a.saved_moments?.[0]?.count ?? 0
    const bc = b.saved_moments?.[0]?.count ?? 0
    return bc - ac
  })
  const moments: Moment[] = sorted as Moment[]

  return <WallClient initialMoments={moments} />
}
