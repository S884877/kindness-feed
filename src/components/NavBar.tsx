import Link from 'next/link'

export default function NavBar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-20 bg-white border-b border-stone-200 shadow-sm">
      <nav className="nav-inner h-14 flex items-center px-4">
        <Link href="/" className="text-stone-900 font-bold text-lg tracking-tight">
          the kindness project
        </Link>
      </nav>
    </header>
  )
}
