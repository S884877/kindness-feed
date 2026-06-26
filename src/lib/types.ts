export type User = {
  id: string
  name: string | null
  avatar_url: string | null
  created_at: string
}

export type Moment = {
  id: string
  user_id: string
  kindness: string
  feeling: string
  created_at: string
  users?: User
  reaction_counts?: { warmth: number; heart: number }
  user_reactions?: { warmth: boolean; heart: boolean }
}

export type Reaction = {
  id: string
  moment_id: string
  user_id: string
  type: 'warmth' | 'heart'
  created_at: string
}
