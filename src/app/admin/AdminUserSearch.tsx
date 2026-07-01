'use client'

import { useState } from 'react'

type UserFunnel = {
  email: string
  sharesSent: number
  linksOpened: number
  signedIn: number
  actsPosted: number
}

export default function AdminUserSearch() {
  const [query, setQuery] = useState('')
  const [result, setResult] = useState<UserFunnel | null>(null)
  const [loading, setLoading] = useState(false)
  const [notFound, setNotFound] = useState(false)

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setNotFound(false)
    setResult(null)
    const res = await fetch(`/api/admin/user-funnel?q=${encodeURIComponent(query.trim())}`)
    if (res.ok) {
      const data = await res.json()
      if (data.email) setResult(data)
      else setNotFound(true)
    } else {
      setNotFound(true)
    }
    setLoading(false)
  }

  return (
    <div>
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by email…"
          style={{
            flex: 1,
            border: '1px solid #e5e5e5',
            borderRadius: 10,
            padding: '10px 14px',
            fontSize: 14,
            outline: 'none',
          }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            background: '#1a1a1a',
            color: 'white',
            border: 'none',
            borderRadius: 10,
            padding: '10px 20px',
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          {loading ? 'Searching…' : 'Search'}
        </button>
      </form>

      {notFound && <p style={{ color: '#aaa', fontSize: 13 }}>No user found.</p>}

      {result && (
        <div>
          <p style={{ fontSize: 13, color: '#888', marginBottom: 16 }}>Funnel for <strong>{result.email}</strong></p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Shares Sent', value: result.sharesSent },
              { label: 'Links Opened', value: result.linksOpened },
              { label: 'Signed In', value: result.signedIn },
              { label: 'Acts Posted', value: result.actsPosted },
            ].map((s) => (
              <div key={s.label} style={{ background: '#fafafa', borderRadius: 12, padding: '14px 16px', border: '1px solid #eee' }}>
                <div style={{ fontSize: 26, fontWeight: 700, color: '#c2674c' }}>{s.value}</div>
                <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 80 }}>
            {[result.sharesSent, result.linksOpened, result.signedIn, result.actsPosted].map((v, i) => {
              const max = Math.max(result.sharesSent, 1)
              return (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height: Math.max((v / max) * 70, 4),
                    background: `rgba(194,103,76,${0.4 + (1 - i / 4) * 0.6})`,
                    borderRadius: '3px 3px 0 0',
                  }}
                />
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
