import { createClient } from '@/lib/supabase/server'
import Feed from '@/components/Feed'
import PostModal from '@/components/PostModal'
import { Moment } from '@/lib/types'

const PAGE_SIZE = 10

export default async function Home() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('moments')
    .select('*, reactions(type)')
    .order('created_at', { ascending: false })
    .range(0, PAGE_SIZE - 1)

  const moments: Moment[] = (data ?? []).map((m: any) => ({
    ...m,
    warmth_count: (m.reactions ?? []).filter((r: any) => r.type === 'warmth').length,
  }))

  return (
    <>
      <Feed initialMoments={moments} />
      <PostModal />
    </>
  )
}
