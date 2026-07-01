import { createClient } from '@/lib/supabase/server'
import {
  ActsPerDayChart,
  SignupsPerDayChart,
  SharePlatformChart,
  FormCompletionChart,
  DevicePieChart,
  FunnelChart,
} from './AdminCharts'
import AdminUserSearch from './AdminUserSearch'
import AdminAutoRefresh from './AdminAutoRefresh'

export const dynamic = 'force-dynamic'

function StatCard({
  label,
  value,
  change,
}: {
  label: string
  value: number | string
  change?: string
}) {
  return (
    <div style={{
      background: 'white',
      borderRadius: 16,
      padding: '20px 24px',
      border: '1px solid #eee',
      minWidth: 0,
    }}>
      <div style={{ fontSize: 32, fontWeight: 700, color: '#1a1a1a', lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>{label}</div>
      {change && <div style={{ fontSize: 11, color: '#aaa', marginTop: 6 }}>{change}</div>}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 48 }}>
      <h2 style={{ fontSize: 15, fontWeight: 600, color: '#444', marginBottom: 16, letterSpacing: '-0.01em' }}>
        {title}
      </h2>
      {children}
    </section>
  )
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: 'white',
      borderRadius: 16,
      padding: '24px',
      border: '1px solid #eee',
      ...style,
    }}>
      {children}
    </div>
  )
}

function pct(a: number, b: number) {
  if (!b) return '—'
  return `${Math.round((a / b) * 100)}%`
}

function daysBucket(ms: number) {
  const mins = ms / 60000
  if (mins < 1) return 'Under 1 min'
  if (mins < 2) return '1–2 min'
  if (mins < 5) return '2–5 min'
  return 'Over 5 min'
}

export default async function AdminDashboard() {
  const supabase = await createClient()

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = today.toISOString()

  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString()

  const thirtyDaysAgo = new Date(today)
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString()

  const weekAgo = new Date(today)
  weekAgo.setDate(weekAgo.getDate() - 7)
  const weekAgoStr = weekAgo.toISOString()

  const [
    { count: totalMoments },
    { count: totalChains },
    { count: totalUsers },
    { count: totalShares },
    { count: totalActs },
    { count: totalSaves },
    { count: momentsToday },
    { count: momentsYesterday },
    { count: momentsThisWeek },
    { data: linkOpensRaw },
    { data: shareClicksRaw },
    { data: chainSigninsRaw },
    { data: momentsLast30 },
    { data: loginEventsRaw },
    { data: formEventsRaw },
    { data: chainsTable },
    { data: recentUsers },
  ] = await Promise.all([
    supabase.from('moments').select('*', { count: 'exact', head: true }),
    supabase.from('chains').select('*', { count: 'exact', head: true }),
    supabase.from('accounts').select('*', { count: 'exact', head: true }),
    supabase.from('share_clicks').select('*', { count: 'exact', head: true }),
    supabase.from('chain_acts').select('*', { count: 'exact', head: true }),
    supabase.from('saved_moments').select('*', { count: 'exact', head: true }),
    supabase.from('moments').select('*', { count: 'exact', head: true }).gte('created_at', todayStr),
    supabase.from('moments').select('*', { count: 'exact', head: true }).gte('created_at', yesterdayStr).lt('created_at', todayStr),
    supabase.from('moments').select('*', { count: 'exact', head: true }).gte('created_at', weekAgoStr),
    supabase.from('chain_link_opens').select('chain_id, visitor_fingerprint'),
    supabase.from('share_clicks').select('platform, clicked_at'),
    supabase.from('chain_signins').select('id'),
    supabase.from('moments').select('created_at').gte('created_at', thirtyDaysAgoStr).order('created_at'),
    supabase.from('login_events').select('user_id, device_type, logged_in_at'),
    supabase.from('form_events').select('form_started_at, form_completed_at'),
    supabase.from('chains').select('id, starter_user_id, started_at'),
    supabase.from('login_events').select('user_id, logged_in_at').order('logged_in_at', { ascending: false }).limit(20),
  ])

  // Deduplicated link opens
  const uniqueOpens = new Set(
    (linkOpensRaw ?? []).map((r: any) => `${r.chain_id}:${r.visitor_fingerprint}`)
  ).size

  // Overview change labels
  const todayCount = momentsToday ?? 0
  const yesterdayCount = momentsYesterday ?? 0
  const changeVsYesterday = yesterdayCount === 0
    ? '—'
    : todayCount >= yesterdayCount
      ? `+${todayCount - yesterdayCount} vs yesterday`
      : `${todayCount - yesterdayCount} vs yesterday`

  // Funnel data
  const funnelStages = [
    { label: 'Shares Sent', value: totalShares ?? 0 },
    {
      label: 'Links Opened',
      value: uniqueOpens,
      pct: pct(uniqueOpens, totalShares ?? 0),
    },
    {
      label: 'Signed In',
      value: chainSigninsRaw?.length ?? 0,
      pct: pct(chainSigninsRaw?.length ?? 0, uniqueOpens),
    },
    {
      label: 'Acts Posted',
      value: totalActs ?? 0,
      pct: pct(totalActs ?? 0, chainSigninsRaw?.length ?? 0),
    },
  ]

  // Acts per day (last 30)
  const actsPerDayMap: Record<string, number> = {}
  for (const row of momentsLast30 ?? []) {
    const d = (row as any).created_at.slice(0, 10)
    actsPerDayMap[d] = (actsPerDayMap[d] ?? 0) + 1
  }
  const actsPerDay = Object.entries(actsPerDayMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date: date.slice(5), count }))

  // New signups per day (first login per user)
  const firstLoginPerUser: Record<string, string> = {}
  for (const row of loginEventsRaw ?? []) {
    const r = row as any
    if (!firstLoginPerUser[r.user_id] || r.logged_in_at < firstLoginPerUser[r.user_id]) {
      firstLoginPerUser[r.user_id] = r.logged_in_at
    }
  }
  const signupsPerDayMap: Record<string, number> = {}
  for (const dateStr of Object.values(firstLoginPerUser)) {
    const d = dateStr.slice(0, 10)
    if (d >= thirtyDaysAgoStr.slice(0, 10)) {
      signupsPerDayMap[d] = (signupsPerDayMap[d] ?? 0) + 1
    }
  }
  const signupsPerDay = Object.entries(signupsPerDayMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date: date.slice(5), count }))

  // Share platform breakdown
  const platformMap: Record<string, number> = {}
  for (const row of shareClicksRaw ?? []) {
    const r = row as any
    platformMap[r.platform] = (platformMap[r.platform] ?? 0) + 1
  }
  const platformData = Object.entries(platformMap).map(([platform, count]) => ({ platform, count }))

  // Device breakdown
  const deviceMap: Record<string, number> = {}
  for (const row of loginEventsRaw ?? []) {
    const r = row as any
    deviceMap[r.device_type] = (deviceMap[r.device_type] ?? 0) + 1
  }
  const deviceData = Object.entries(deviceMap).map(([device_type, count]) => ({ device_type, count }))

  // Form completion buckets
  const bucketMap: Record<string, number> = {}
  let totalCompletionMs = 0
  let completedCount = 0
  let startedNotCompleted = 0
  for (const row of formEventsRaw ?? []) {
    const r = row as any
    if (r.form_started_at && r.form_completed_at) {
      const ms = new Date(r.form_completed_at).getTime() - new Date(r.form_started_at).getTime()
      if (ms > 0) {
        const bucket = daysBucket(ms)
        bucketMap[bucket] = (bucketMap[bucket] ?? 0) + 1
        totalCompletionMs += ms
        completedCount++
      }
    } else if (r.form_started_at && !r.form_completed_at) {
      startedNotCompleted++
    }
  }
  const BUCKET_ORDER = ['Under 1 min', '1–2 min', '2–5 min', 'Over 5 min']
  const completionBuckets = BUCKET_ORDER.map((bucket) => ({ bucket, count: bucketMap[bucket] ?? 0 }))
  const avgCompletionSec = completedCount ? Math.round(totalCompletionMs / completedCount / 1000) : 0
  const dropOffPct = formEventsRaw?.length
    ? Math.round((startedNotCompleted / formEventsRaw.length) * 100)
    : 0

  // Recent users
  const recentUserIds = [...new Set((recentUsers ?? []).map((r: any) => r.user_id))]
  const { data: accountsData } = await supabase
    .from('accounts')
    .select('id, email')
    .in('id', recentUserIds.slice(0, 20))

  const accountMap: Record<string, string> = {}
  for (const a of accountsData ?? []) {
    accountMap[(a as any).id] = (a as any).email
  }

  const recentUserRows = (recentUsers ?? [])
    .filter((r: any, i: number, arr: any[]) => arr.findIndex((x: any) => x.user_id === r.user_id) === i)
    .slice(0, 20)
    .map((r: any) => ({
      email: accountMap[r.user_id] ?? r.user_id.slice(0, 8) + '…',
      lastLogin: new Date(r.logged_in_at).toLocaleDateString(),
    }))

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px 80px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 36 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>
            the kindness wall — admin
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
            <p style={{ fontSize: 13, color: '#aaa', margin: 0 }}>
              {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
            <AdminAutoRefresh intervalSeconds={30} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <a
            href="/admin"
            style={{ fontSize: 13, color: '#c2674c', textDecoration: 'none', fontWeight: 500 }}
          >
            ↻ Refresh
          </a>
          <form action="/api/admin/logout" method="POST">
            <button
              type="submit"
              style={{ fontSize: 13, color: '#888', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Sign out
            </button>
          </form>
        </div>
      </div>

      {/* Section 1 — Overview */}
      <Section title="Overview">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
          <StatCard label="Total Moments" value={totalMoments ?? 0} />
          <StatCard label="This Week" value={momentsThisWeek ?? 0} change="acts shared last 7 days" />
          <StatCard label="Today" value={todayCount} change={changeVsYesterday} />
          <StatCard label="Total Users" value={totalUsers ?? 0} />
          <StatCard label="Total Saves" value={totalSaves ?? 0} />
          <StatCard label="Total Shares Sent" value={totalShares ?? 0} />
          <StatCard label="Moments Today" value={todayCount} change={changeVsYesterday} />
        </div>
      </Section>

      {/* Section 2 — Funnel */}
      <Section title="Conversion Funnel">
        <Card>
          <FunnelChart stages={funnelStages} />
          <div style={{ display: 'flex', gap: 24, marginTop: 16, flexWrap: 'wrap' }}>
            {funnelStages.map((s, i) => (
              <div key={s.label}>
                <span style={{ fontSize: 12, color: '#aaa' }}>{s.label}: </span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{s.value}</span>
                {s.pct && <span style={{ fontSize: 11, color: '#c2674c', marginLeft: 6 }}>{s.pct} of prev</span>}
              </div>
            ))}
          </div>
        </Card>
      </Section>

      {/* Section 3 — Charts */}
      <Section title="Activity Over Last 30 Days">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <Card>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 12 }}>Moments Posted</div>
            <ActsPerDayChart data={actsPerDay} />
          </Card>
          <Card>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 12 }}>New User Sign-ups</div>
            <SignupsPerDayChart data={signupsPerDay} />
          </Card>
        </div>
      </Section>

      {/* Section 4 — Share platforms */}
      <Section title="Share Platform Breakdown">
        <Card style={{ maxWidth: 500 }}>
          {platformData.length === 0 ? (
            <p style={{ color: '#aaa', fontSize: 13 }}>No share data yet.</p>
          ) : (
            <SharePlatformChart data={platformData} />
          )}
        </Card>
      </Section>

      {/* Section 5 — Drop-off (chains only, show placeholder when empty) */}
      <Section title="Chain Drop-off Analysis">
        <Card>
          {(chainsTable ?? []).length === 0 ? (
            <p style={{ color: '#aaa', fontSize: 13 }}>No chains yet — data will appear once chains are created.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #eee' }}>
                  {['Chain ID', 'Links Opened', 'Acts Posted', 'Conversion %', 'Started'].map((h) => (
                    <th key={h} style={{ textAlign: 'left', padding: '8px 0', color: '#888', fontWeight: 500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(chainsTable ?? []).map((chain: any) => {
                  const opens = (linkOpensRaw ?? []).filter((r: any) => r.chain_id === chain.id).length
                  const acts = 0
                  return (
                    <tr key={chain.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                      <td style={{ padding: '8px 0', fontFamily: 'monospace', fontSize: 12 }}>{chain.id.slice(0, 8)}…</td>
                      <td style={{ padding: '8px 0' }}>{opens}</td>
                      <td style={{ padding: '8px 0' }}>{acts}</td>
                      <td style={{ padding: '8px 0' }}>{pct(acts, opens)}</td>
                      <td style={{ padding: '8px 0', color: '#aaa' }}>{new Date(chain.started_at).toLocaleDateString()}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </Card>
      </Section>

      {/* Section 6 — Top chains */}
      <Section title="Top Chains by Size">
        <Card>
          {(chainsTable ?? []).length === 0 ? (
            <p style={{ color: '#aaa', fontSize: 13 }}>No chains yet.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #eee' }}>
                  {['#', 'Chain ID', 'Total Acts', 'Started On', 'Status'].map((h) => (
                    <th key={h} style={{ textAlign: 'left', padding: '8px 0', color: '#888', fontWeight: 500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(chainsTable ?? []).map((chain: any, i: number) => {
                  const lastAct = null
                  const stalled = false
                  return (
                    <tr key={chain.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                      <td style={{ padding: '8px 0', color: '#aaa' }}>{i + 1}</td>
                      <td style={{ padding: '8px 0', fontFamily: 'monospace', fontSize: 12 }}>{chain.id.slice(0, 8)}…</td>
                      <td style={{ padding: '8px 0' }}>0</td>
                      <td style={{ padding: '8px 0', color: '#aaa' }}>{new Date(chain.started_at).toLocaleDateString()}</td>
                      <td style={{ padding: '8px 0' }}>
                        <span style={{
                          fontSize: 11,
                          padding: '2px 8px',
                          borderRadius: 20,
                          background: stalled ? '#fef3f2' : '#f0fdf4',
                          color: stalled ? '#c2674c' : '#16a34a',
                        }}>
                          {stalled ? 'Stalled' : 'Active'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </Card>
      </Section>

      {/* Section 7 — Form completion */}
      <Section title="Form Completion Time">
        <Card>
          {completedCount === 0 ? (
            <p style={{ color: '#aaa', fontSize: 13 }}>No form completion data yet.</p>
          ) : (
            <>
              <FormCompletionChart data={completionBuckets} />
              <div style={{ display: 'flex', gap: 32, marginTop: 16, fontSize: 13 }}>
                <div>
                  <span style={{ color: '#aaa' }}>Avg completion: </span>
                  <span style={{ fontWeight: 600 }}>{avgCompletionSec}s</span>
                </div>
                <div>
                  <span style={{ color: '#aaa' }}>Started but never completed: </span>
                  <span style={{ fontWeight: 600 }}>{dropOffPct}%</span>
                </div>
              </div>
            </>
          )}
        </Card>
      </Section>

      {/* Section 8 — Login activity */}
      <Section title="User Login Activity">
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16 }}>
          <Card>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 12 }}>Device Split</div>
            {deviceData.length === 0 ? (
              <p style={{ color: '#aaa', fontSize: 13 }}>No login data yet.</p>
            ) : (
              <DevicePieChart data={deviceData} />
            )}
          </Card>
          <Card>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 12 }}>20 Most Recently Active</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #eee' }}>
                  <th style={{ textAlign: 'left', padding: '6px 0', color: '#888', fontWeight: 500 }}>Email</th>
                  <th style={{ textAlign: 'right', padding: '6px 0', color: '#888', fontWeight: 500 }}>Last Login</th>
                </tr>
              </thead>
              <tbody>
                {recentUserRows.map((u: any) => (
                  <tr key={u.email} style={{ borderBottom: '1px solid #f5f5f5' }}>
                    <td style={{ padding: '6px 0', color: '#333' }}>{u.email}</td>
                    <td style={{ padding: '6px 0', textAlign: 'right', color: '#aaa' }}>{u.lastLogin}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      </Section>

      {/* Section 9 — Per-user funnel search */}
      <Section title="Per-User Funnel">
        <Card>
          <AdminUserSearch />
        </Card>
      </Section>
    </div>
  )
}
