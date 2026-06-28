import Link from 'next/link'

export const metadata = {
  title: 'how this started — the kindness wall',
}

const XLink = ({ href, children }: { href: string; children: string }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="underline underline-offset-2 decoration-[var(--ink-soft)]"
  >
    {children}
  </a>
)

const pCls = 'font-serif text-[19px] leading-[1.75] text-[var(--ink-soft)]'

export default function AboutPage() {
  return (
    <div className="feed-frame px-6 py-16">
      <h1 className="font-serif text-[28px] text-[var(--ink)] mb-12 leading-snug">
        how this started
      </h1>

      <div className="flex flex-col gap-7">
        <p className={pCls}>
          i'm <XLink href="https://x.com/DanielPraburaj">daniel praburaj</XLink>. in january 2026, i fractured my left tibia and spent 8 weeks in a cast. i couldn't move around much. it wasn't terrible, but i needed help with things every day. i was working from home, and my brother <XLink href="https://x.com/apraveen494">saju</XLink> took care of almost everything. he made sure i had my medications on time, food on time. he was there whenever i needed him, middle of the night, middle of the day, any time.
        </p>

        <p className={pCls}>
          we got really close that period. and i realized he didn't have to do any of it just because he's family. but he did.
        </p>

        <p className={pCls}>
          that got me thinking about how many people have been kind to me, every day, my whole life. there are so many small moments of kindness around us that we just miss them. we're moving too fast. we're not paying attention. we're not stopping to think about how good the world actually is. that's why i started working on this with <XLink href="https://x.com/apraveen494">saju</XLink>. to collect those moments. to share them.
        </p>

        <p className={pCls}>here's how it works:</p>

        <ol className="flex flex-col gap-4 pl-1">
          {[
            'you post the kindest thing someone has done for you. today, two weeks ago, twenty years ago. anywhere. you share it.',
            'you read what others have shared. the small things people did for them that they still remember.',
            'and if something hits you today, tomorrow, whenever, come back and post that too.',
          ].map((item, i) => (
            <li key={i} className="flex gap-4">
              <span className="font-serif text-[19px] text-[var(--ink-faint)] shrink-0 w-5">{i + 1}.</span>
              <p className={pCls}>{item}</p>
            </li>
          ))}
        </ol>

        <p className={pCls}>
          that's it. no likes, no comments. you can save the ones that stay with you, and see everything you've posted when you log back in.
        </p>

        <p className={pCls}>
          i didn't build this to keep you hooked. i don't want you to feel guilty after using this. i built it so you leave feeling grateful. feeling like the world is a little nicer than you thought. because it is. go spread some of that around. peace.
        </p>

        <p className={pCls}>
          —{' '}
          <XLink href="https://x.com/DanielPraburaj">daniel</XLink>
          {' '}and{' '}
          <XLink href="https://x.com/apraveen494">saju</XLink>
        </p>
      </div>

      <div className="mt-16">
        <Link
          href="/"
          className="text-sm text-[var(--ink-faint)] hover:text-[var(--ink)] transition-colors"
        >
          ← back to the wall
        </Link>
      </div>
    </div>
  )
}
