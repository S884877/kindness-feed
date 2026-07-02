import Link from 'next/link'
import HomeCounter from '@/components/kindness-wall/HomeCounter'
import HeroVideo from '@/components/kindness-wall/HeroVideo'

export default function KindnessWallLanding() {
  return (
    <div className="kw-split">
      <section className="kw-split-left">
        <h1 className="kw-headline text-[40px] md:text-[56px] mb-6">
          hey. this is the kindness wall.
        </h1>
        <p className="kw-body text-[15px] md:text-[16px] max-w-md mb-3">
          the goal for the page is simple — 1 million kind acts around the world in a week.
        </p>  
        <p className="kw-body text-[15px] md:text-[16px] max-w-md mb-3">
          here&apos;s how it works: do something nice for a friend, family, or even for a stranger. post it here. send it to atleast 2 friends (or more) and get them to
          do the same for someone else. that&apos;s it.
        </p>
        <p className="kw-body text-[15px] md:text-[16px] max-w-md mb-6">
          why do this? bcoz the world needs more love and kindness {'<3'}
        </p>
        <HomeCounter />
        <div className="flex flex-wrap gap-3">
          <Link href="/post" className="kw-btn">
            post something
          </Link>
          <Link href="/feed" className="kw-btn kw-btn-outline">
            the feed
          </Link>
        </div>
      </section>

      <div className="kw-split-right">
        <HeroVideo />
      </div>
    </div>
  )
}
