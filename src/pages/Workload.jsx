import { useState } from 'react'
import { Users, AlertTriangle, Gauge, Inbox, Bot, Sparkles, Wand2 } from 'lucide-react'
import { useStore, visibleLeads } from '../store'
import { Stat, Tabs, Bar, Badge, Avatar, Field, Empty } from '../components/ui'
import { STAGES } from '../data/constants'
import { fmtDate } from '../lib/utils'
import { go } from '../components/Layout'

export default function Workload() {
  const { state, me, actions } = useStore()
  const [tab, setTab] = useState('workload')
  const [n, setN] = useState(5)
  const [office, setOffice] = useState(me.role === 'admin' ? 'Bangalore' : me.office)
  const [plan, setPlan] = useState(null)
  const [assign, setAssign] = useState({})

  const leads = visibleLeads(state, me)
  const active = leads.filter((l) => l.status === 'active')
  const agents = state.users.filter((u) => u.active && u.role !== 'admin' && u.capacity > 0 && (me.role === 'admin' || u.office === me.office))
  const rows = agents.map((a) => {
    const load = state.leads.filter((l) => l.assignedTo === a.id && l.status === 'active').length
    return { ...a, load, pct: Math.round((load / a.capacity) * 100), won: state.leads.filter((l) => l.assignedTo === a.id && l.status === 'won').length }
  }).sort((a, b) => b.pct - a.pct)
  const overloaded = rows.filter((r) => r.pct >= 90).length
  const free = rows.reduce((a, r) => a + Math.max(0, r.capacity - r.load), 0)
  const unassigned = active.filter((l) => !l.assignedTo)

  const preview = () => setPlan(actions.previewDistribution(office, n))
  const apply = () => { actions.applyDistribution(office, plan); setPlan(null) }

  return (
    <div className="page">
      <div className="stats-4">
        <Stat accent label="Active Leads" value={active.length} hint={me.role === 'admin' ? 'Across both offices' : `${me.office} office`} icon={Users} />
        <Stat label="Overloaded Agents" value={overloaded} hint="≥ 90% of capacity" icon={AlertTriangle} />
        <Stat label="Available Capacity" value={free} hint={`Open slots across ${rows.filter((r) => r.load < r.capacity).length} agents`} icon={Gauge} />
        <Stat label="Unassigned" value={unassigned.length} hint="Needs assignment" icon={Inbox} onClick={() => setTab('workload')} />
      </div>

      <Tabs value={tab} onChange={setTab} tabs={[{ key: 'workload', label: 'Agent Workload' }, { key: 'ai', label: 'AI Lead Distribution' }]} />

      {tab === 'workload' && (
        <>
          {unassigned.length > 0 && (
            <div className="card">
              <div className="card-head"><h3>Unassigned leads ({unassigned.length})</h3>
                <button className="btn btn-gold btn-sm" onClick={() => { setTab('ai'); setN(0); setOffice(me.role === 'admin' ? unassigned[0].office : me.office); setPlan(null) }}><Wand2 size={14} /> Auto-assign with AI</button>
              </div>
              {unassigned.map((l) => (
                <div key={l.id} className="mini-row">
                  <div className="grow"><button className="link" onClick={() => go(`lead/${l.id}`)}><b>{l.name}</b></button><div className="muted tiny">{l.source} · {l.office} · {STAGES[l.stage]} · {fmtDate(l.createdAt)}</div></div>
                  <select className="w-auto" value={assign[l.id] || ''} onChange={(e) => setAssign({ ...assign, [l.id]: e.target.value })}>
                    <option value="">Pick agent…</option>
                    {rows.filter((r) => r.office === l.office).map((r) => <option key={r.id} value={r.id}>{r.name} ({r.load}/{r.capacity})</option>)}
                  </select>
                  <button className="btn btn-primary btn-sm" disabled={!assign[l.id]} onClick={() => actions.assignLead(l.id, assign[l.id])}>Assign</button>
                </div>
              ))}
            </div>
          )}
          <div className="card">
            <div className="card-head"><h3>Agent Workload</h3></div>
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Agent</th><th>Office</th><th className="hide-sm">Team</th><th>Leads</th><th>Capacity</th><th style={{ minWidth: 140 }}>Workload</th><th>Conversions</th></tr></thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id}>
                      <td><div className="row gap-sm"><Avatar name={r.name} size={28} /><div><b>{r.name}</b><div className="muted tiny">{r.designation}</div></div></div></td>
                      <td><Badge tone={r.office === 'Dubai' ? 'amber' : 'blue'}>{r.office}</Badge></td>
                      <td className="hide-sm">{r.department}</td>
                      <td><b>{r.load}</b></td>
                      <td>{r.capacity}</td>
                      <td><div className="row gap-sm"><Bar value={r.load} max={r.capacity} tone={r.pct >= 90 ? 'red' : r.pct >= 70 ? 'amber' : 'green'} /><span className="tiny">{r.pct}%</span></div></td>
                      <td>{r.won}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!rows.length && <Empty title="No agents" text="Add team members in Org & People." />}
          </div>
        </>
      )}

      {tab === 'ai' && (
        <div className="grid-dash">
          <div className="card">
            <div className="card-head"><h3><Bot size={17} /> AI Lead Distribution</h3></div>
            <p className="muted small">The AI analyses current workloads and distributes leads fairly across available agents based on capacity, performance and current load. Unassigned leads in the office are included automatically.</p>
            <Field label="Number of new leads" hint="Incoming leads to simulate (0 = only distribute existing unassigned leads)">
              <input type="number" min="0" max="50" value={n} onChange={(e) => { setN(Math.max(0, Math.min(50, Number(e.target.value)))); setPlan(null) }} />
            </Field>
            <Field label="Office">
              <select value={office} onChange={(e) => { setOffice(e.target.value); setPlan(null) }} disabled={me.role !== 'admin'}>
                <option>Bangalore</option><option>Dubai</option>
              </select>
            </Field>
            <button className="btn btn-primary btn-block" onClick={preview}><Sparkles size={15} /> Run AI Distribution</button>
          </div>
          <div className="card">
            <div className="card-head"><h3>Distribution preview</h3></div>
            {!plan ? <Empty icon={Bot} title="No preview yet" text="Run the AI to see how leads would be split." /> : plan.total === 0 ? (
              <Empty title="Nothing to distribute" text="Set a number of new leads, or there are no unassigned leads in this office." />
            ) : !plan.agents.length ? (
              <Empty title="No active agents in this office" text="Add CRM Executives in Org & People first." />
            ) : (
              <>
                <p className="small"><b>{plan.total}</b> leads ({plan.unassigned} unassigned + {plan.newLeads} new) → <b>{plan.agents.filter((a) => a.give).length}</b> agents in {office}</p>
                <table className="table">
                  <thead><tr><th>Agent</th><th>Now</th><th>+ New</th><th>After</th><th>Conv.</th></tr></thead>
                  <tbody>
                    {plan.agents.map((a) => (
                      <tr key={a.id}>
                        <td>{a.name}</td><td>{a.load}/{a.capacity}</td>
                        <td><b className={a.give ? 'text-green' : 'muted'}>+{a.give}</b></td>
                        <td><Bar value={a.load + a.give} max={a.capacity} tone={(a.load + a.give) / a.capacity >= 0.9 ? 'red' : 'green'} /></td>
                        <td className="tiny">{Math.round(a.conv * 100)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="row gap-sm end mt">
                  <button className="btn btn-ghost" onClick={() => setPlan(null)}>Discard</button>
                  <button className="btn btn-gold" onClick={apply}>Confirm & Assign</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
