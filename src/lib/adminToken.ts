const TOKEN_DATA = 'admin-session-v1'

async function getKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  )
}

export async function signAdminToken(secret: string): Promise<string> {
  const key = await getKey(secret)
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(TOKEN_DATA))
  return Buffer.from(sig).toString('base64')
}

export async function verifyAdminToken(token: string, secret: string): Promise<boolean> {
  try {
    const expected = await signAdminToken(secret)
    return token === expected
  } catch {
    return false
  }
}
