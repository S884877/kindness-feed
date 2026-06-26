export type Moment = {
  id: string
  user_id: string | null
  posted_by: string
  kindness: string
  feeling: string
  location: string | null
  created_at: string
}

export type Reaction = {
  id: string
  moment_id: string
  user_id: string
  type: 'warmth' | 'heart'
  created_at: string
}
