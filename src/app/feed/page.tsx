import type { Metadata } from 'next'
import KindnessFeedList from '@/components/kindness-wall/KindnessFeedList'

export const metadata: Metadata = {
  title: 'the feed — the kindness wall.',
  description: 'small acts of kindness, shared by real people.',
}

export default function KindnessWallFeedPage() {
  return (
    <div className="kw-frame">
      <h1 className="kw-headline text-[28px] md:text-[36px] mb-3">
        the feed.
      </h1>
      <p className="kw-body text-[15px] mb-12 max-w-lg">
        every act below was posted by someone, just like you. shown in a
        different order every time.
      </p>
      <KindnessFeedList />
    </div>
  )
}
