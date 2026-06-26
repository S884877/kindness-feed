import Link from 'next/link'

export default function NavBar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-20 bg-white border-b border-stone-200 shadow-sm">
      <nav className="max-w-[680px] mx-auto px-4 h-14 flex items-center">
        <Link href="/" className="text-stone-900 font-bold text-lg tracking-tight">
          the kindness project
        </Link>
      </nav>
    </header>
  )
}
