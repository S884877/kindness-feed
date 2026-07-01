import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import MillionCounter from './MillionCounter'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'the kind collective',
  description: 'pay it forward, one kind act at a time.',
}

const GOAL = 10_000_000

export default async function OneMillionKindPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>
}) {
  const params = await searchParams
  const refAccountId = params.ref ?? null

  const supabase = await createClient()
  const { count } = await supabase
    .from('moments')
    .select('*', { count: 'exact', head: true })

  return <MillionCounter total={count ?? 0} goal={GOAL} refAccountId={refAccountId} />
}
