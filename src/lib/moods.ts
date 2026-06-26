export type Mood = 'grateful' | 'surprised' | 'moved' | 'overwhelmed'

export const MOOD_ORDER: Mood[] = ['grateful', 'surprised', 'moved', 'overwhelmed']

export const MOODS: Record<Mood, { label: string; chipBg: string; chipText: string }> = {
  grateful:    { label: 'grateful',    chipBg: '#f7e7c4', chipText: '#9a6a16' },
  surprised:   { label: 'surprised',   chipBg: '#fbddc6', chipText: '#b15a2a' },
  moved:       { label: 'moved',       chipBg: '#f4d6d2', chipText: '#a64f49' },
  overwhelmed: { label: 'overwhelmed', chipBg: '#e9dcd2', chipText: '#8a6650' },
}

export function isMood(v: unknown): v is Mood {
  return typeof v === 'string' && v in MOODS
}
