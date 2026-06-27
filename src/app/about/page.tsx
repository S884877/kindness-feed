import Link from 'next/link'

export const metadata = {
  title: 'why this exists — the kindness wall',
}

const paragraphs = [
  'Someone held the door open a little longer than they had to.',
  'A stranger paid for your coffee. Your neighbor knocked with a plate of food. A friend said exactly the right thing at exactly the right time.',
  'Small moments. Easy to forget. But you didn\'t — and that means something.',
  'the kindness wall is a place to put those moments down before they fade. no names. no likes. no noise. just real people, remembering real kindness.',
  'because the world has enough places to share what\'s wrong with it. this is a place to remember what\'s quietly, beautifully right.',
  'share a moment. keep one that moves you. pass on the kindness. come back when you need to be reminded that people are good.',
  'they are. they really are.',
]

export default function AboutPage() {
  return (
    <div className="feed-frame px-6 py-16">
      <h1 className="font-serif text-[28px] text-[var(--ink)] mb-12 leading-snug">
        why this exists
      </h1>

      <div className="flex flex-col gap-7">
        {paragraphs.map((p, i) => (
          <p
            key={i}
            className="font-serif text-[19px] leading-[1.75] text-[var(--ink-soft)]"
          >
            {p}
          </p>
        ))}
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
