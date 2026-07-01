import { createClient } from '@/lib/supabase/server'
import MillionCounter from './MillionCounter'

export const dynamic = 'force-dynamic'

const GOAL = 10_000_000

export default async function OneMillionKindPage() {
  const supabase = await createClient()
  const { count } = await supabase
    .from('moments')
    .select('*', { count: 'exact', head: true })

  return <MillionCounter total={count ?? 0} goal={GOAL} />
}
