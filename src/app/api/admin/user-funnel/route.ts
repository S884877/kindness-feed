import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken } from '@/lib/adminToken'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const token = req.cookies.get('admin_session')?.value
  if (!token || !(await verifyAdminToken(token, process.env.ADMIN_SECRET ?? ''))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const q = req.nextUrl.searchParams.get('q') ?? ''
  if (!q) return NextResponse.json({})

  const supabase = await createClient()

  const { data: account } = await supabase
    .from('accounts')
    .select('id, email')
    .ilike('email', `%${q}%`)
    .limit(1)
    .single()

  if (!account) return NextResponse.json({})

  const userId = (account as any).id

  const [
    { count: sharesSent },
    { data: openedChains },
    { count: signedIn },
    { count: actsPosted },
  ] = await Promise.all([
    supabase.from('share_clicks').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('chain_link_opens').select('visitor_fingerprint').eq('ref_user_id', userId),
    supabase.from('chain_signins').select('*', { count: 'exact', head: true }).eq('ref_user_id', userId),
    supabase.from('acts').select('*', { count: 'exact', head: true }).eq('user_id', userId),
  ])

  const uniqueOpens = new Set((openedChains ?? []).map((r: any) => r.visitor_fingerprint)).size

  return NextResponse.json({
    email: (account as any).email,
    sharesSent: sharesSent ?? 0,
    linksOpened: uniqueOpens,
    signedIn: signedIn ?? 0,
    actsPosted: actsPosted ?? 0,
  })
}
