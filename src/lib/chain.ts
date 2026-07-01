export type ChainAct = {
  id: string
  parent_id: string | null
  chain_id: string
  depth: number
  share_token: string
  user_id: string
  act_text: string
  feeling_text: string | null
  location_text: string | null
  image_url: string | null
  phone_country_code: string | null
  phone_number: string | null
  created_at: string
}

const TOKEN_CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789'

export function generateShareToken(length = 8): string {
  let out = ''
  for (let i = 0; i < length; i++) {
    out += TOKEN_CHARS[Math.floor(Math.random() * TOKEN_CHARS.length)]
  }
  return out
}

// milestones: 5, then every +10 after that (15, 25, 35, ...)
export function milestonesCrossed(prevCount: number, newCount: number): number[] {
  const hits: number[] = []
  if (prevCount < 5 && newCount >= 5) hits.push(5)
  let m = 15
  while (m <= newCount) {
    if (prevCount < m) hits.push(m)
    m += 10
  }
  return hits
}

export function chainShareUrl(origin: string, token: string): string {
  return `${origin}/?ref=${token}`
}
