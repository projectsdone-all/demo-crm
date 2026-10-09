import { useState } from 'react'
import { useStore, visibleLeads } from '../store'
import { SectionHead, Badge } from '../components/ui'
import { HBarList, Donut, PALETTE } from '../components/charts'
import { SOURCES } from '../data/constants'
import { fmtAED } from '../lib/utils'

export default function Sources() {
  const { state, me } = useStore()
  const [office, setOffice] = useState('')
  const leads = visibleLeads(state, me).filter((l) => !office || l.office === office)
  const rows = SOURCES.map((s, i) => {
    const sl = leads.filter((l) => l.source === s)
    const won = sl.filter((l) => l.status === 'won')
    const lost = sl.filter((l) => l.status === 'unable' || l.status === 'cancelled')
    return {
      source: s, color: PALETTE[i], total: sl.length, active: sl.filter((l) => l.status === 'active').length, won: won.length, lost: lost.length,
      rate: sl.length ? Math.round((won.length / sl.length) * 100) : 0,
      avgScore: sl.length ? Math.round(sl.reduce((a, l) => a + l.score, 0) / sl.length) : 0,
      revenue: won.reduce((a, l) => a + (l.dealValueAED || 0), 0),
    }
  }).sort((a, b) => b.total - a.total)
  const best = [...rows].filter((r) => r.total >= 2).sort((a, b) => b.rate - a.rate)[0]

  return (
    <div className="page">
      <SectionHead title="Source Performance" subtitle="Conversion rates by lead source">
        {me.role === 'admin' && (
          <select value={office} onChange={(e) => setOffice(e.target.value)} className="w-auto">
            <option value="">Both offices</option><option>Bangalore</option><option>Dubai</option>
          </select>
        )}
      </SectionHead>
      {best && <div className="alert alert-gold"><b>{best.source}</b> is your best-converting source at <b>{best.rate}%</b> — consider shifting more budget there.</div>}
      <div className="grid-dash">
        <div className="card">
          <div className="card-head"><h3>Conversion rate by source</h3></div>
          <HBarList data={rows.map((r) => ({ label: r.source, value: r.rate, color: r.color }))} format={(v) => `${v}%`} />
        </div>
        <div className="card">
          <div className="card-head"><h3>Lead volume</h3></div>
          <Donut data={rows.map((r) => ({ label: r.source, value: r.total, color: r.color }))} label={leads.length} sub="leads" />
        </div>
      </div>
      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Source</th><th>Leads</th><th>Active</th><th>Won</th><th>Lost</th><th>Conversion</th><th className="hide-sm">Avg score</th><th>Revenue</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.source}>
                  <td><span className="legend-dot" style={{ background: r.color }} /> <b>{r.source}</b></td>
                  <td>{r.total}</td><td>{r.active}</td><td>{r.won}</td><td>{r.lost}</td>
                  <td><Badge tone={r.rate >= 15 ? 'green' : r.rate >= 5 ? 'amber' : 'gray'}>{r.rate}%</Badge></td>
                  <td className="hide-sm">{r.avgScore}</td>
                  <td>{r.revenue ? fmtAED(r.revenue) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
