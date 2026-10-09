import { useState } from 'react'

export function ColumnChart({ data, height = 180, color = 'var(--navy)', format = (v) => v }) {
  const [hover, setHover] = useState(null)
  const max = Math.max(1, ...data.map((d) => d.value))
  const w = 100 / data.length
  return (
    <div className="colchart" style={{ height }}>
      <div className="colchart-bars">
        {data.map((d, i) => (
          <div key={d.label} className="colchart-col" style={{ width: `${w}%` }} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
            <div className="colchart-val">{hover === i || data.length <= 8 ? format(d.value) : ''}</div>
            <div className="colchart-bar" style={{ height: `${(d.value / max) * 100}%`, background: d.color || color, opacity: hover == null || hover === i ? 1 : 0.55 }} />
          </div>
        ))}
      </div>
      <div className="colchart-labels">
        {data.map((d) => <div key={d.label} style={{ width: `${w}%` }}>{d.label}</div>)}
      </div>
    </div>
  )
}

export function HBarList({ data, format = (v) => v, color = 'var(--gold)' }) {
  const max = Math.max(1, ...data.map((d) => d.value))
  return (
    <div className="hbars">
      {data.map((d) => (
        <div key={d.label} className="hbar-row">
          <div className="hbar-label">{d.label}</div>
          <div className="hbar-track"><div className="hbar-fill" style={{ width: `${(d.value / max) * 100}%`, background: d.color || color }} /></div>
          <div className="hbar-val">{format(d.value)}</div>
        </div>
      ))}
    </div>
  )
}

export function Donut({ data, size = 140, label, sub }) {
  const total = data.reduce((a, d) => a + d.value, 0) || 1
  let acc = 0
  const r = 52
  const c = 2 * Math.PI * r
  return (
    <div className="donut-wrap">
      <svg width={size} height={size} viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={r} fill="none" stroke="var(--line)" strokeWidth="16" />
        {data.map((d) => {
          const len = (d.value / total) * c
          const el = <circle key={d.label} cx="70" cy="70" r={r} fill="none" stroke={d.color} strokeWidth="16" strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-acc} transform="rotate(-90 70 70)" />
          acc += len
          return el
        })}
        <text x="70" y="68" textAnchor="middle" className="donut-num">{label}</text>
        <text x="70" y="86" textAnchor="middle" className="donut-sub">{sub}</text>
      </svg>
      <div className="legend">
        {data.map((d) => <div key={d.label}><i style={{ background: d.color }} />{d.label} <b>{d.value}</b></div>)}
      </div>
    </div>
  )
}

export const PALETTE = ['#1C2B4A', '#C9A45C', '#3D7A8A', '#9B6B9E', '#D97757', '#5B8C5A', '#7A8BA8']
