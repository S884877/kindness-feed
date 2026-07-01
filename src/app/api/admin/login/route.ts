import { NextRequest, NextResponse } from 'next/server'
import { signAdminToken } from '@/lib/adminToken'

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()

  const validEmail = process.env.ADMIN_EMAIL
  const validPassword = process.env.ADMIN_PASSWORD
  const secret = process.env.ADMIN_SECRET ?? ''

  if (!validEmail || !validPassword || email !== validEmail || password !== validPassword) {
    return NextResponse.json({ error: 'Incorrect credentials' }, { status: 401 })
  }

  const token = await signAdminToken(secret)

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
