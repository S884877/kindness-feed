import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export async function POST(req: Request) {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('login error: SUPABASE_SERVICE_ROLE_KEY is not set')
      return NextResponse.json({ error: 'server is misconfigured. try again later.' }, { status: 500 })
    }

    const { email, password } = await req.json()
    if (!email || !password) {
      return NextResponse.json({ error: 'email and password are required' }, { status: 400 })
    }

    const supabase = admin()
    const { data: account } = await supabase
      .from('accounts')
      .select('id, email, password')
      .eq('email', String(email).trim().toLowerCase())
      .single()

    if (!account) {
      return NextResponse.json({ error: 'incorrect email or password' }, { status: 401 })
    }

    const ok = await bcrypt.compare(password, account.password)
    if (!ok) {
      return NextResponse.json({ error: 'incorrect email or password' }, { status: 401 })
    }

    return NextResponse.json({ id: account.id, email: account.email })
  } catch (e) {
    console.error('login route crashed:', e)
    return NextResponse.json({ error: 'something went wrong. try again.' }, { status: 500 })
  }
}
