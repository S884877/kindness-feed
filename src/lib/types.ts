import type { Mood } from './moods'

export type Moment = {
  id: string
  user_id: string | null
  posted_by: string
  kindness: string
  feeling: string
  location: string | null
  mood: Mood | null
  image_url: string | null
  created_at: string
}

export type SavedMoment = {
  id: string
  user_id: string
  moment_id: string
  created_at: string
}
