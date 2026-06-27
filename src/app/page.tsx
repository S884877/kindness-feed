import { createClient } from '@/lib/supabase/server'
import WallClient from '@/components/WallClient'
import { Moment } from '@/lib/types'

const PAGE_SIZE = 10

export default async function Home() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('moments')
    .select('id, kindness, feeling, location, mood, image_url, created_at, posted_by, user_id')
    .order('created_at', { ascending: false })
    .range(0, PAGE_SIZE - 1)

  if (error) console.error('SSR moments fetch error:', error)
  const moments: Moment[] = (data ?? []) as Moment[]

  return <WallClient initialMoments={moments} />
}
