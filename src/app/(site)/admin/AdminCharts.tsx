'use client'

import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'

const PLATFORM_COLORS: Record<string, string> = {
  whatsapp: '#25D366',
  sms: '#4A90E2',
  email: '#F5A623',
  instagram: '#C13584',
  copy: '#8E8E8E',
}

const PIE_COLORS = ['#25D366', '#4A90E2', '#F5A623', '#C13584', '#8E8E8E']
const DEVICE_COLORS = ['#c2674c', '#6f655b', '#a89c8f']

export function ActsPerDayChart({ data }: { data: { date: string; count: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} />
        <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip />
        <Line type="monotone" dataKey="count" stroke="#c2674c" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}

export function SignupsPerDayChart({ data }: { data: { date: string; count: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} />
        <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip />
        <Bar dataKey="count" fill="#6f655b" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function SharePlatformChart({ data }: { data: { platform: string; count: number }[] }) {
  const total = data.reduce((s, d) => s + d.count, 0)
  return (
    <div>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="platform"
            cx="50%"
            cy="50%"
            outerRadius={80}
            label={(props) => {
              const entry = data[props.index as number]
              return `${entry?.platform ?? ''} ${((props.percent ?? 0) * 100).toFixed(0)}%`
            }}
            labelLine={false}
          >
            {data.map((entry, i) => (
              <Cell key={entry.platform} fill={PLATFORM_COLORS[entry.platform] ?? PIE_COLORS[i % PIE_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginTop: 8 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #eee' }}>
            <th style={{ textAlign: 'left', padding: '6px 0', color: '#888', fontWeight: 500 }}>Platform</th>
            <th style={{ textAlign: 'right', padding: '6px 0', color: '#888', fontWeight: 500 }}>Count</th>
            <th style={{ textAlign: 'right', padding: '6px 0', color: '#888', fontWeight: 500 }}>%</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.platform} style={{ borderBottom: '1px solid #f5f5f5' }}>
              <td style={{ padding: '6px 0', textTransform: 'capitalize' }}>{row.platform}</td>
              <td style={{ padding: '6px 0', textAlign: 'right' }}>{row.count}</td>
              <td style={{ padding: '6px 0', textAlign: 'right', color: '#888' }}>
                {total ? ((row.count / total) * 100).toFixed(1) : 0}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function FormCompletionChart({ data }: { data: { bucket: string; count: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" stroke="#eee" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
        <YAxis type="category" dataKey="bucket" tick={{ fontSize: 11 }} tickLine={false} width={80} />
        <Tooltip />
        <Bar dataKey="count" fill="#c2674c" radius={[0, 3, 3, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function DevicePieChart({ data }: { data: { device_type: string; count: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={data}
          dataKey="count"
          nameKey="device_type"
          cx="50%"
          cy="50%"
          outerRadius={75}
          label={(props) => {
              const entry = data[props.index as number]
              return `${entry?.device_type ?? ''} ${((props.percent ?? 0) * 100).toFixed(0)}%`
            }}
          labelLine={false}
        >
          {data.map((entry, i) => (
            <Cell key={entry.device_type} fill={DEVICE_COLORS[i % DEVICE_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  )
}

export function FunnelChart({
  stages,
}: {
  stages: { label: string; value: number; pct?: string }[]
}) {
  const max = Math.max(...stages.map((s) => s.value), 1)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 160 }}>
      {stages.map((stage, i) => {
        const height = Math.max((stage.value / max) * 140, 4)
        return (
          <div key={stage.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            {stage.pct && (
              <span style={{ fontSize: 11, color: '#888' }}>{stage.pct}</span>
            )}
            <div
              style={{
                width: '100%',
                height,
                background: `rgba(194,103,76,${0.4 + (1 - i / stages.length) * 0.6})`,
                borderRadius: '4px 4px 0 0',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'center',
                paddingTop: 4,
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 600, color: 'white' }}>{stage.value}</span>
            </div>
            <span style={{ fontSize: 11, color: '#666', textAlign: 'center' }}>{stage.label}</span>
          </div>
        )
      })}
    </div>
  )
}
