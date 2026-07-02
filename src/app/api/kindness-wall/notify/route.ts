import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const phone = typeof body.phone === 'string' ? body.phone.trim() : ''
    const post_id = typeof body.post_id === 'string' ? body.post_id : null

    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: 'enter a valid email' }, { status: 400 })
    }
    if (!phone) {
      return NextResponse.json({ error: 'enter a phone number' }, { status: 400 })
    }

    const supabase = admin()
    const { error } = await supabase.from('kindness_wall_leads').insert({
      email,
      phone,
      post_id,
    })

    if (error) {
      console.error('kindness wall lead insert error:', error)
      return NextResponse.json({ error: 'something went wrong' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('kindness wall notify error:', e)
    return NextResponse.json({ error: 'something went wrong' }, { status: 500 })
  }
}
