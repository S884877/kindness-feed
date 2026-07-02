import type { Metadata } from 'next'
import PostSomethingFlow from '@/components/kindness-wall/PostSomethingFlow'

export const metadata: Metadata = {
  title: 'post something — the kindness wall.',
  description: 'what\'s the nicest thing you\'ve done recently for someone?',
}

export default function PostSomethingPage() {
  return (
    <div className="kw-frame">
      <PostSomethingFlow />
    </div>
  )
}
