export type Session = { id: string; email: string }

export function getSession(): Session | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem('kp_session')
    if (!raw) return null
    return JSON.parse(raw) as Session
  } catch {
    return null
  }
}

export function saveSession(session: Session): void {
  localStorage.setItem('kp_session', JSON.stringify(session))
}

export function clearSession(): void {
  localStorage.removeItem('kp_session')
}
