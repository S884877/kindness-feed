import { createClient } from '@/lib/supabase/client'

function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof navigator === 'undefined') return 'desktop'
  const ua = navigator.userAgent
  if (/tablet|ipad|playbook|silk/i.test(ua)) return 'tablet'
  if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) return 'mobile'
  return 'desktop'
}

export async function trackLogin(userId: string) {
  try {
    const supabase = createClient()
    await supabase.from('login_events').insert({
      user_id: userId,
      device_type: getDeviceType(),
    })
  } catch {}
}

export async function trackFormStarted(userId: string, chainId?: string) {
  try {
    const supabase = createClient()
    const { data } = await supabase
      .from('form_events')
      .insert({ user_id: userId, chain_id: chainId ?? null, form_started_at: new Date().toISOString() })
      .select('id')
      .single()
    return data?.id as string | undefined
  } catch {}
}

export async function trackFormCompleted(formEventId: string) {
  try {
    const supabase = createClient()
    await supabase
      .from('form_events')
      .update({ form_completed_at: new Date().toISOString() })
      .eq('id', formEventId)
  } catch {}
}

export async function trackShareClick(
  userId: string,
  actId: string,
  platform: 'whatsapp' | 'sms' | 'email' | 'instagram' | 'copy',
) {
  try {
    const supabase = createClient()
    await supabase.from('share_clicks').insert({ act_id: actId, user_id: userId, platform })
  } catch {}
}

export async function trackChainLinkOpen(chainId: string, refUserId?: string) {
  try {
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : ''
    const fingerprint = btoa(`${ua}`.slice(0, 200)).slice(0, 64)
    const supabase = createClient()
    await supabase.from('chain_link_opens').insert({
      chain_id: chainId,
      ref_user_id: refUserId ?? null,
      visitor_fingerprint: fingerprint,
    })
  } catch {}
}

export async function trackChainSignin(userId: string, chainId: string, refUserId?: string) {
  try {
    const supabase = createClient()
    await supabase.from('chain_signins').insert({
      user_id: userId,
      chain_id: chainId,
      ref_user_id: refUserId ?? null,
    })
  } catch {}
}
