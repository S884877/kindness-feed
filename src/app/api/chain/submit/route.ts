import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateShareToken, milestonesCrossed } from '@/lib/chain'

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

async function sendEmail(to: string, subject: string, html: string) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({ from: 'the kindness wall <hello@thekindnesswall.com>', to, subject, html }),
  })
  if (!res.ok) console.error('resend error:', await res.text())
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      user_id,
      act_text,
      feeling_text,
      location_text,
      image_url,
      parent_share_token,
    } = body

    if (!user_id || !act_text?.trim()) {
      return NextResponse.json({ error: 'missing required fields' }, { status: 400 })
    }

    const supabase = admin()

    // phone comes from the poster's account (collected once at signup), not
    // re-entered per post.
    const { data: account } = await supabase
      .from('accounts')
      .select('phone_country_code, phone_number')
      .eq('id', user_id)
      .single()

    let parent: { id: string; chain_id: string; depth: number; user_id: string } | null = null
    if (parent_share_token) {
      const { data } = await supabase
        .from('chain_acts')
        .select('id, chain_id, depth, user_id')
        .eq('share_token', parent_share_token)
        .single()
      parent = data
    }

    let share_token = generateShareToken()
    for (let i = 0; i < 5; i++) {
      const { data } = await supabase.from('chain_acts').select('id').eq('share_token', share_token).maybeSingle()
      if (!data) break
      share_token = generateShareToken()
    }

    const id = crypto.randomUUID()
    const chain_id = parent ? parent.chain_id : id
    const depth = parent ? parent.depth + 1 : 1

    const { data: inserted, error: insertErr } = await supabase
      .from('chain_acts')
      .insert({
        id,
        parent_id: parent?.id ?? null,
        chain_id,
        depth,
        share_token,
        user_id,
        act_text: act_text.trim(),
        feeling_text: feeling_text?.trim() || null,
        location_text: location_text?.trim() || null,
        image_url: image_url || null,
        phone_country_code: account?.phone_country_code ?? null,
        phone_number: account?.phone_number ?? null,
      })
      .select()
      .single()

    if (insertErr) {
      console.error('chain insert error:', insertErr)
      return NextResponse.json({ error: insertErr.message }, { status: 500 })
    }

    // fire-and-forget notifications — don't block the response on email delivery
    notifyAncestors(supabase, parent, inserted).catch((e) => console.error('chain notify error:', e))

    return NextResponse.json({ ok: true, entry: inserted })
  } catch (e) {
    console.error('chain submit error:', e)
    return NextResponse.json({ error: 'something went wrong' }, { status: 500 })
  }
}

async function notifyAncestors(
  supabase: ReturnType<typeof admin>,
  parent: { id: string; chain_id: string; depth: number; user_id: string } | null,
  entry: { id: string; act_text: string },
) {
  if (!parent) return

  // direct-join email to the immediate parent, always
  const { data: parentAccount } = await supabase.from('accounts').select('email').eq('id', parent.user_id).single()
  if (parentAccount?.email) {
    await sendEmail(
      parentAccount.email,
      'someone just continued your chain',
      chainEmailHtml(
        'someone just continued your chain.',
        'they read what you did and added their own act of kindness right after yours. the chain keeps going.',
      ),
    )
  }

  // milestone emails — walk every ancestor up to the root of the whole chain,
  // check if this new entry pushed their subtree past a threshold (5, 15, 25, 35...)
  let currentId: string | null = parent.id
  let guard = 0
  while (currentId && guard < 1000) {
    guard++
    const { data: ancestor }: { data: { id: string; parent_id: string | null; user_id: string } | null } = await supabase
      .from('chain_acts')
      .select('id, parent_id, user_id')
      .eq('id', currentId)
      .single()
    if (!ancestor) break

    const { data: countData } = await supabase.rpc('chain_subtree_count', { p_entry_id: ancestor.id })
    const newCount = Number(countData ?? 0)
    const hits = milestonesCrossed(newCount - 1, newCount)

    for (const milestone of hits) {
      const { error: dupeErr } = await supabase
        .from('chain_milestones_sent')
        .insert({ entry_id: ancestor.id, milestone })
      if (dupeErr) continue // already sent (unique constraint hit) or insert failed — skip

      const { data: ownerAccount } = await supabase.from('accounts').select('email').eq('id', ancestor.user_id).single()
      if (ownerAccount?.email) {
        await sendEmail(
          ownerAccount.email,
          `your chain just reached ${milestone} people`,
          chainEmailHtml(
            `your chain just reached ${milestone} people.`,
            `what started with your act of kindness has now spread to ${milestone} people who kept it going. that's real.`,
          ),
        )
      }
    }

    currentId = ancestor.parent_id
  }
}

function chainEmailHtml(headline: string, body: string): string {
  return `
    <div style="font-family: Georgia, serif; max-width: 520px; margin: 0 auto; padding: 40px 24px; color: #3a3028;">
      <p style="font-size: 20px; line-height: 1.6; margin: 0 0 20px;">${headline}</p>
      <p style="font-size: 17px; line-height: 1.7; margin: 0 0 32px; color: #5a4a3a;">${body}</p>
      <a href="https://thekindnesswall.com" style="display: inline-block; background: linear-gradient(135deg, #cf7152, #b85a3e); color: white; text-decoration: none; padding: 14px 28px; border-radius: 50px; font-size: 15px; font-family: -apple-system, sans-serif; font-weight: 600;">
        see the chain
      </a>
      <p style="margin-top: 40px; font-size: 13px; color: #a89c8f;">— daniel and saju, the kindness wall</p>
    </div>
  `
}
