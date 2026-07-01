type View = 'wall' | 'chain' | 'profile'

function WallIcon({ active }: { active: boolean }) {
  const col = active ? 'var(--accent)' : 'var(--ink-faint)'
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="4" rx="1" />
      <rect x="3" y="10" width="18" height="4" rx="1" />
      <rect x="3" y="17" width="18" height="4" rx="1" />
    </svg>
  )
}

function ChainLinkIcon({ active }: { active: boolean }) {
  const col = active ? 'white' : 'var(--ink-faint)'
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  )
}

function PersonIcon({ active }: { active: boolean }) {
  const col = active ? 'var(--accent)' : 'var(--ink-faint)'
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

export default function BottomNav({
  activeView,
  onViewChange,
}: {
  activeView: View
  onViewChange: (v: View) => void
}) {
  const isChainActive = activeView === 'chain'

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-20 flex items-center justify-around"
      style={{
        height: '64px',
        background: 'rgba(252, 249, 243, 0.92)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderTop: '1px solid var(--line)',
      }}
    >
      <button
        onClick={() => onViewChange('wall')}
        className="flex flex-col items-center gap-1 px-5 py-1"
        aria-label="wall"
      >
        <WallIcon active={activeView === 'wall'} />
        <span className="text-[10px] font-medium" style={{ color: activeView === 'wall' ? 'var(--accent)' : 'var(--ink-faint)' }}>
          wall
        </span>
      </button>

      <button
        onClick={() => onViewChange('chain')}
        aria-label="chain"
        className="flex items-center gap-2 rounded-full px-5 -mt-3 active:scale-95 transition-all"
        style={{
          height: '44px',
          background: isChainActive
            ? 'linear-gradient(135deg, #cf7152, #b85a3e)'
            : '#f0e4d4',
          boxShadow: isChainActive
            ? '0 6px 20px -2px rgba(184,90,62,0.55), 0 2px 8px rgba(184,90,62,0.2)'
            : 'none',
          fontSize: '12px',
          fontWeight: 600,
          color: isChainActive ? 'white' : 'var(--ink-faint)',
          whiteSpace: 'nowrap',
          transition: 'all 0.25s ease',
        }}
      >
        <ChainLinkIcon active={isChainActive} />
        chain
      </button>

      <button
        onClick={() => onViewChange('profile')}
        className="flex flex-col items-center gap-1 px-5 py-1"
        aria-label="profile"
      >
        <PersonIcon active={activeView === 'profile'} />
        <span className="text-[10px] font-medium" style={{ color: activeView === 'profile' ? 'var(--accent)' : 'var(--ink-faint)' }}>
          profile
        </span>
      </button>
    </nav>
  )
}
