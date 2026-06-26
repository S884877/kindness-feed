import { createClient } from '@/lib/supabase/server'
import Feed from '@/components/Feed'
import PostModal from '@/components/PostModal'
import { Moment } from '@/lib/types'

const PAGE_SIZE = 10

export default async function Home() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('moments')
    .select('id, kindness, feeling, location, first_name, mood, me_too_count, created_at')
    .order('created_at', { ascending: false })
    .range(0, PAGE_SIZE - 1)

  const moments: Moment[] = (data ?? []) as Moment[]

  return (
    <>
      <Feed initialMoments={moments} />
      <PostModal />
    </>
  )
}
