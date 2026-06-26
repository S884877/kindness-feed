import type { Mood } from './moods'

export type Moment = {
  id: string
  user_id: string | null
  posted_by: string
  kindness: string
  feeling: string
  location: string | null
  first_name: string | null
  mood: Mood | null
  me_too_count: number
  created_at: string
}

export type Reaction = {
  id: string
  moment_id: string
  user_id: string
  type: 'warmth' | 'heart'
  created_at: string
}
