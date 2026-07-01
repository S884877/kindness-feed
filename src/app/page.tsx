import { createClient } from '@/lib/supabase/server'
import ChainHome from '@/components/ChainHome'
import type { ChainAct } from '@/lib/chain'

type Props = { searchParams: Promise<{ ref?: string }> }

export default async function Home({ searchParams }: Props) {
  const { ref } = await searchParams
  let parentPost: ChainAct | null = null

  if (ref) {
    const supabase = await createClient()
    const { data } = await supabase
      .from('chain_acts')
      .select('*')
      .eq('share_token', ref)
      .single()
    parentPost = (data as ChainAct) ?? null
  }

  return <ChainHome parentToken={ref} parentPost={parentPost} />
}
