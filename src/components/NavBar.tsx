import Link from 'next/link'

export default function NavBar() {
  return (
    <header
      className="fixed top-0 left-0 right-0 z-20"
      style={{
        background: 'rgba(252, 249, 243, 0.82)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--line)',
      }}
    >
      <nav className="nav-inner h-16 flex items-center px-5">
        <Link href="/" className="font-serif text-[var(--ink)] text-xl tracking-tight">
          the kindness project
        </Link>
      </nav>
    </header>
  )
}
