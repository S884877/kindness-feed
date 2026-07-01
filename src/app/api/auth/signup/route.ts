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
      console.error('signup error: SUPABASE_SERVICE_ROLE_KEY is not set')
      return NextResponse.json({ error: 'server is misconfigured. try again later.' }, { status: 500 })
    }

    const { email, password, phone_country_code, phone_number } = await req.json()
    if (!email || !password) {
      return NextResponse.json({ error: 'email and password are required' }, { status: 400 })
    }
    if (String(password).length < 6) {
      return NextResponse.json({ error: 'password must be at least 6 characters' }, { status: 400 })
    }
    const cleanPhone = String(phone_number ?? '').replace(/\D/g, '')
    if (!phone_country_code || !cleanPhone) {
      return NextResponse.json({ error: 'phone number is required' }, { status: 400 })
    }

    const supabase = admin()
    const normalizedEmail = String(email).trim().toLowerCase()

    const { data: existing } = await supabase
      .from('accounts')
      .select('id')
      .eq('email', normalizedEmail)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'an account with that email already exists' }, { status: 409 })
    }

    const hashed = await bcrypt.hash(password, 10)
    const { data: account, error } = await supabase
      .from('accounts')
      .insert({
        email: normalizedEmail,
        password: hashed,
        phone_country_code,
        phone_number: cleanPhone,
      })
      .select('id, email')
      .single()

    if (error || !account) {
      console.error('signup error:', error)
      return NextResponse.json({ error: 'something went wrong. try again.' }, { status: 500 })
    }

    return NextResponse.json({ id: account.id, email: account.email })
  } catch (e) {
    console.error('signup route crashed:', e)
    return NextResponse.json({ error: 'something went wrong. try again.' }, { status: 500 })
  }
}
