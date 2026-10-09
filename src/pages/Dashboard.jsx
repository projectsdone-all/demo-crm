import { Users, UsersRound, Building2, Trophy, Wallet, ShieldAlert, CheckSquare, CalendarClock, ArrowRight } from 'lucide-react'
import { useStore, userById } from '../store'
import { Stat, Badge, Avatar } from '../components/ui'
import { ColumnChart, HBarList, Donut, PALETTE } from '../components/charts'
import { STAGES, SOURCES, ROLES } from '../data/constants'
import { fmtAED, timeAgo, addDays } from '../lib/utils'
import { go } from '../components/Layout'

export default function Dashboard() {
  const { state } = useStore()
  const leads = state.leads
  const won = leads.filter((l) => l.status === 'won')
  const revenue = won.reduce((a, l) => a + (l.dealValueAED || 0), 0)
  const active = leads.filter((l) => l.status === 'active')
  const convRate = leads.length ? Math.round((won.length / leads.length) * 100) : 0

  const months = [...Array(6)].map((_, i) => {
    const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - (5 - i))
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    return { label: d.toLocaleDateString('en-GB', { month: 'short' }), value: leads.filter((l) => l.createdAt.slice(0, 7) === key).length }
  })
  const stageData = STAGES.map((s, i) => ({ label: `${i + 1}. ${s}`, value: active.filter((l) => l.stage === i).length }))
  const sourceData = SOURCES.map((s, i) => ({ label: s, value: leads.filter((l) => l.source === s).length, color: PALETTE[i] }))
  const pending = [
    { label: 'Deals awaiting final approval', n: state.approvals.filter((a) => a.status === 'pending_admin').length, icon: CheckSquare, to: 'approvals' },
    { label: 'Escalation requests', n: state.escalations.filter((e) => e.status === 'pending').length, icon: ShieldAlert, to: 'escalations' },
    { label: 'Payroll records to sign off', n: state.payroll.filter((p) => p.status === 'pending').length, icon: Wallet, to: 'payroll' },
    { label: 'Leave requests pending', n: state.leaves.filter((l) => l.status === 'pending').length, icon: CalendarClock, to: 'leave' },
  ]
  const weekAgo = addDays(new Date(), -7).toISOString()

  return (
    <div className="page">
      <div className="stats-4">
        <Stat accent label="Total Leads" value={leads.length} hint={`${active.length} in active pipeline`} icon={Users} onClick={() => go('leads')} />
        <Stat label="Team Members" value={state.users.filter((u) => u.active).length} hint="Across India & Dubai" icon={UsersRound} onClick={() => go('org')} />
        <Stat label="Properties Listed" value={state.projects.length} hint={`${state.units.filter((u) => u.status === 'Available').length} units available`} icon={Building2} onClick={() => go('inventory')} />
        <Stat label="Conversions" value={won.length} hint={`${convRate}% conversion · ${fmtAED(revenue)}`} icon={Trophy} onClick={() => go('reports')} />
      </div>

      <div className="grid-dash">
        <div className="card">
          <div className="card-head"><h3>New leads — last 6 months</h3><span className="muted small">{leads.filter((l) => l.createdAt > weekAgo).length} this week</span></div>
          <ColumnChart data={months} />
        </div>
        <div className="card">
          <div className="card-head"><h3>Lead sources</h3></div>
          <Donut data={sourceData} label={leads.length} sub="leads" />
        </div>
      </div>

      <div className="grid-dash">
        <div className="card">
          <div className="card-head"><h3>Active pipeline by SOP stage</h3><button className="link" onClick={() => go('pipeline')}>Open pipeline <ArrowRight size={13} /></button></div>
          <HBarList data={stageData} />
        </div>
        <div className="card">
          <div className="card-head"><h3>Needs your attention</h3></div>
          <div className="stack-sm">
            {pending.map((p) => (
              <button key={p.label} className="attn-row" onClick={() => go(p.to)}>
                <p.icon size={16} /><span className="grow">{p.label}</span>
                <Badge tone={p.n ? 'gold' : 'gray'}>{p.n}</Badge>
              </button>
            ))}
          </div>
          <div className="card-head mt"><h3>Office split</h3></div>
          <div className="office-split">
            {['Bangalore', 'Dubai'].map((o) => {
              const ol = leads.filter((l) => l.office === o)
              return (
                <div key={o} className="office-box">
                  <span className="eyebrow">{o === 'Dubai' ? '🇦🇪' : '🇮🇳'} {o}</span>
                  <b>{ol.length}</b>
                  <span className="muted tiny">{ol.filter((l) => l.status === 'won').length} won · {ol.filter((l) => l.status === 'active').length} active</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h3>Team</h3><button className="link" onClick={() => go('org')}>Manage people <ArrowRight size={13} /></button></div>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Name</th><th>Designation</th><th>Office</th><th className="hide-sm">Email</th><th>Active leads</th><th>Won</th><th>Status</th></tr></thead>
            <tbody>
              {state.users.map((u) => (
                <tr key={u.id}>
                  <td><div className="row gap-sm"><Avatar name={u.name} size={28} /><b>{u.name}</b></div></td>
                  <td>{u.designation}<div className="muted tiny">{u.designation === ROLES[u.role].label ? u.department : ROLES[u.role].label}</div></td>
                  <td><Badge tone={u.office === 'Dubai' ? 'amber' : 'blue'}>{u.office === 'Dubai' ? '🇦🇪' : '🇮🇳'} {u.office}</Badge></td>
                  <td className="hide-sm muted">{u.email}</td>
                  <td>{leads.filter((l) => l.assignedTo === u.id && l.status === 'active').length}</td>
                  <td>{leads.filter((l) => l.assignedTo === u.id && l.status === 'won').length}</td>
                  <td><Badge tone={u.active ? 'green' : 'gray'}>{u.active ? 'Active' : 'Inactive'}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h3>Recent activity</h3><button className="link" onClick={() => go('audit')}>Full audit log <ArrowRight size={13} /></button></div>
        {state.audit.slice(0, 6).map((a) => (
          <div key={a.id} className="mini-row">
            <Avatar name={userById(state, a.by)?.name || 'System'} size={26} />
            <div className="grow"><b className="small">{a.action}</b> <span className="small muted">— {a.detail}</span></div>
            <span className="muted tiny">{timeAgo(a.at)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
