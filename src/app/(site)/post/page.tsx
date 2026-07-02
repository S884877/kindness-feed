import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PostForm from './PostForm'

export default async function PostPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="max-w-sm mx-auto py-8">
      <h1 className="text-xl font-semibold text-stone-800 mb-2">share a moment</h1>
      <p className="text-stone-400 text-sm mb-8">something someone did for you, and how it landed</p>
      <PostForm userId={user.id} />
    </div>
  )
}
