import Link from 'next/link'

export default function KindnessWallLanding() {
  return (
    <div className="kw-split">
      <section className="kw-split-left">
        <h1 className="kw-headline text-[40px] md:text-[56px] mb-6">
          the kindness wall.
        </h1>
        <p className="kw-body text-[15px] md:text-[16px] max-w-md mb-3">
          we&apos;re working toward a million kind acts — small things people did
          for a friend, for family, or even for a stranger, just to put a
          little more love into the world.
        </p>
        <p className="kw-body text-[15px] md:text-[16px] max-w-md mb-10">
          why? because we need more of it.
        </p>
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
        <video
          className="kw-video-fallback"
          autoPlay
          muted
          loop
          playsInline
          poster=""
        >
          <source src="/kindness-wall/hero-loop.mp4" type="video/mp4" />
        </video>
      </div>
    </div>
  )
}
