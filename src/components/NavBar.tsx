import Link from 'next/link'
import NavProfile from './NavProfile'

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
      <nav className="nav-inner h-16 flex items-center justify-between px-5">
        <Link href="/" className="font-serif text-[var(--ink)] text-xl tracking-tight">
          the kindness wall
        </Link>
        <div className="flex flex-col items-end" style={{ gap: '8px' }}>
          <div className="flex items-center gap-4">
            <Link
              href="/onemillionkind"
              className="text-xs text-[var(--ink-faint)] hover:text-[var(--ink)] transition-colors leading-none"
            >
              onemillionkind
            </Link>
            <Link
              href="/about"
              className="text-xs text-[var(--ink-faint)] hover:text-[var(--ink)] transition-colors leading-none"
            >
              how this started
            </Link>
          </div>
          <NavProfile />
        </div>
      </nav>
    </header>
  )
}
