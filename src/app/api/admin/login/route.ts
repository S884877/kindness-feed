import { NextRequest, NextResponse } from 'next/server'
import { signAdminToken } from '@/lib/adminToken'

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()

  const secret = (process.env.ADMIN_SECRET ?? '').trim()
  const validEmail = (process.env.ADMIN_EMAIL ?? '').trim()
  const validPassword = (process.env.ADMIN_PASSWORD ?? '').trim()

  // Accept login if either: email+password match env vars, OR password alone matches ADMIN_SECRET
  const credentialsOk =
    (validEmail && validPassword && email.trim() === validEmail && password.trim() === validPassword) ||
    (secret && password.trim() === secret)

  if (!credentialsOk) {
    return NextResponse.json({ error: 'Incorrect credentials' }, { status: 401 })
  }

  const token = await signAdminToken(secret || password.trim())

  const res = NextResponse.json({ ok: true })
  res.cookies.set('admin_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8, // 8 hours
  })
  return res
}
