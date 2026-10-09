import { useState } from 'react'
import { FileBarChart, Download, Eye, Users, KanbanSquare, MapPin, CalendarClock, Wallet, Trophy, PieChart } from 'lucide-react'
import { useStore, userById } from '../store'
import { SectionHead, Modal } from '../components/ui'
import { STAGES, SOURCES, LEAD_STATUS } from '../data/constants'
import { fmtDate, downloadCSV, todayISO } from '../lib/utils'

export default function Reports() {
  const { state } = useStore()
  const [view, setView] = useState(null)
  const name = (id) => userById(state, id)?.name || 'Unassigned'
  const REPORTS = [
    { key: 'leads', title: 'All Leads', desc: 'Every lead with stage, source, owner and status', icon: Users,
      rows: () => state.leads.map((l) => ({ ID: l.id, Name: l.name, Phone: l.phone, Source: l.source, Office: l.office, Stage: STAGES[l.stage], Status: LEAD_STATUS[l.status].label, Score: l.score, Owner: name(l.assignedTo), Created: fmtDate(l.createdAt) })) },
    { key: 'pipeline', title: 'Pipeline Summary', desc: 'Lead count per SOP stage and office', icon: KanbanSquare,
      rows: () => STAGES.map((s, i) => ({ Stage: `${i + 1}. ${s}`, Bangalore: state.leads.filter((l) => l.stage === i && l.office === 'Bangalore' && l.status === 'active').length, Dubai: state.leads.filter((l) => l.stage === i && l.office === 'Dubai' && l.status === 'active').length, Total: state.leads.filter((l) => l.stage === i && l.status === 'active').length })) },
    { key: 'agents', title: 'Agent Performance', desc: 'Leads, wins and conversion rate per agent', icon: Trophy,
      rows: () => state.users.filter((u) => u.role !== 'admin').map((u) => { const ls = state.leads.filter((l) => l.assignedTo === u.id); const w = ls.filter((l) => l.status === 'won').length; return { Agent: u.name, Office: u.office, Leads: ls.length, Active: ls.filter((l) => l.status === 'active').length, Won: w, 'Conversion %': ls.length ? Math.round((w / ls.length) * 100) : 0, Activities: state.activities.filter((a) => a.by === u.id).length } }) },
    { key: 'sources', title: 'Source ROI', desc: 'Volume and conversions by lead source', icon: PieChart,
      rows: () => SOURCES.map((s) => { const ls = state.leads.filter((l) => l.source === s); const w = ls.filter((l) => l.status === 'won'); return { Source: s, Leads: ls.length, Won: w.length, 'Conversion %': ls.length ? Math.round((w.length / ls.length) * 100) : 0, 'Revenue (AED)': w.reduce((a, l) => a + (l.dealValueAED || 0), 0) } }) },
    { key: 'deals', title: 'Closed Deals', desc: 'Won deals with value and closing date', icon: Trophy,
      rows: () => state.leads.filter((l) => l.status === 'won').map((l) => ({ Client: l.name, Agent: name(l.assignedTo), Office: l.office, 'Deal value (AED)': l.dealValueAED || '', Closed: fmtDate(l.closedAt), Source: l.source })) },
    { key: 'visits', title: 'Site Visits', desc: 'Scheduled, completed and cancelled visits', icon: MapPin,
      rows: () => state.visits.map((v) => ({ Date: v.date, Time: v.time, Project: state.projects.find((p) => p.id === v.projectId)?.name, Client: state.leads.find((l) => l.id === v.leadId)?.name || '', Agent: name(v.assignedTo), Status: v.status, Outcome: v.outcome })) },
    { key: 'leave', title: 'Leave Register', desc: 'All leave requests and decisions', icon: CalendarClock,
      rows: () => state.leaves.map((l) => ({ Employee: name(l.userId), Type: l.type, From: l.from, To: l.to, Days: l.days, Status: l.status, Reason: l.reason })) },
    { key: 'payroll', title: 'Payroll Register', desc: 'Payroll records with sign-off status', icon: Wallet,
      rows: () => state.payroll.map((p) => ({ Month: p.month, Employee: name(p.userId), Base: p.base, Commission: p.commission, Deductions: p.deductions, Net: p.net, Status: p.status })) },
  ]
  const r = REPORTS.find((x) => x.key === view)
  const data = r ? r.rows() : []
  return (
    <div className="page">
      <SectionHead title="Reports Center" subtitle="Export and review business reports — generated live from CRM data" />
      <div className="report-grid">
        {REPORTS.map((rep) => {
          const n = rep.rows().length
          return (
            <div key={rep.key} className="card report">
              <div className="report-icon"><rep.icon size={18} /></div>
              <h4>{rep.title}</h4>
              <p className="muted small">{rep.desc}</p>
              <div className="muted tiny">{n} rows</div>
              <div className="row gap-sm mt-sm">
                <button className="btn btn-ghost btn-sm" onClick={() => setView(rep.key)} disabled={!n}><Eye size={14} /> Preview</button>
                <button className="btn btn-primary btn-sm" onClick={() => downloadCSV(`${rep.key}-report-${todayISO()}.csv`, rep.rows())} disabled={!n}><Download size={14} /> CSV</button>
              </div>
            </div>
          )
        })}
      </div>
      <Modal open={!!r} onClose={() => setView(null)} title={r?.title} subtitle={`${data.length} rows`} size="xl" wide
        footer={<button className="btn btn-primary" onClick={() => downloadCSV(`${r.key}-report-${todayISO()}.csv`, data)}><Download size={14} /> Download CSV</button>}>
        {data.length > 0 && (
          <div className="table-wrap">
            <table className="table">
              <thead><tr>{Object.keys(data[0]).map((k) => <th key={k}>{k}</th>)}</tr></thead>
              <tbody>{data.slice(0, 100).map((row, i) => <tr key={i}>{Object.values(row).map((v, j) => <td key={j}>{typeof v === 'number' ? v.toLocaleString('en-IN') : v}</td>)}</tr>)}</tbody>
            </table>
          </div>
        )}
        <FileBarChart size={1} className="sr-only" />
      </Modal>
    </div>
  )
}
