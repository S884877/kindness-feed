type View = 'mine' | 'wall' | 'kept'

function PersonIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'var(--accent)' : 'none'} stroke={active ? 'var(--accent)' : 'var(--ink-faint)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

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

function HeartIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'var(--accent)' : 'none'} stroke={active ? 'var(--accent)' : 'var(--ink-faint)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
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
        onClick={() => onViewChange('mine')}
        className="flex flex-col items-center gap-1 px-6 py-1"
        aria-label="mine"
      >
        <PersonIcon active={activeView === 'mine'} />
        <span className="text-[10px] font-medium" style={{ color: activeView === 'mine' ? 'var(--accent)' : 'var(--ink-faint)' }}>mine</span>
      </button>

      <button
        onClick={() => onViewChange('wall')}
        className="flex flex-col items-center gap-1 px-6 py-1"
        aria-label="wall"
      >
        <WallIcon active={activeView === 'wall'} />
        <span className="text-[10px] font-medium" style={{ color: activeView === 'wall' ? 'var(--accent)' : 'var(--ink-faint)' }}>wall</span>
      </button>

      <button
        onClick={() => onViewChange('kept')}
        className="flex flex-col items-center gap-1 px-6 py-1"
        aria-label="kept"
      >
        <HeartIcon active={activeView === 'kept'} />
        <span className="text-[10px] font-medium" style={{ color: activeView === 'kept' ? 'var(--accent)' : 'var(--ink-faint)' }}>kept</span>
      </button>
    </nav>
  )
}
