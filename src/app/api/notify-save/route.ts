import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  try {
    const { moment_id } = await req.json()
    if (!moment_id) return NextResponse.json({ ok: false }, { status: 400 })

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    // get the moment author's user_id
    const { data: moment } = await supabase
      .from('moments')
      .select('user_id, kindness')
      .eq('id', moment_id)
      .single()

    if (!moment?.user_id) return NextResponse.json({ ok: true })

    // get the author's email from auth.users (requires service role)
    const { data: { user } } = await supabase.auth.admin.getUserById(moment.user_id)
    if (!user?.email) return NextResponse.json({ ok: true })

    const preview = moment.kindness.slice(0, 80) + (moment.kindness.length > 80 ? '…' : '')

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'the kindness wall <hello@thekindnesswall.com>',
        to: user.email,
        subject: 'someone saved your moment',
        html: `
          <div style="font-family: Georgia, serif; max-width: 520px; margin: 0 auto; padding: 40px 24px; color: #3a3028;">
            <p style="font-size: 20px; line-height: 1.6; margin: 0 0 20px;">someone saved your moment.</p>
            <blockquote style="border-left: 3px solid #cf7152; margin: 0 0 24px; padding: 4px 0 4px 20px; color: #7a6a5a; font-style: italic; font-size: 16px; line-height: 1.6;">
              "${preview}"
            </blockquote>
            <p style="font-size: 17px; line-height: 1.7; margin: 0 0 16px; color: #5a4a3a;">
              that means it meant something to them. they read what you wrote and held onto it.
            </p>
            <p style="font-size: 17px; line-height: 1.7; margin: 0 0 32px; color: #5a4a3a;">
              keep sharing. there are more moments like that one — people around you doing small, good things. put them on the wall. someone out there needs to read it.
            </p>
            <a href="https://thekindnesswall.com/share" style="display: inline-block; background: linear-gradient(135deg, #cf7152, #b85a3e); color: white; text-decoration: none; padding: 14px 28px; border-radius: 50px; font-size: 15px; font-family: -apple-system, sans-serif; font-weight: 600;">
              share another moment
            </a>
            <p style="margin-top: 40px; font-size: 13px; color: #a89c8f;">
              — daniel and saju, the kindness wall
            </p>
          </div>
        `,
      }),
    })

    if (!res.ok) {
      const body = await res.text()
      console.error('resend error:', body)
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('notify-save error:', e)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
