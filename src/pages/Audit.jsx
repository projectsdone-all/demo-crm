import { useState } from 'react'
import { Search, Download, ScrollText } from 'lucide-react'
import { useStore, userById } from '../store'
import { SectionHead, Empty, Avatar, Badge } from '../components/ui'
import { fmtDateTime, downloadCSV, todayISO } from '../lib/utils'

const CATS = { lead: 'Leads', approval: 'Approvals', assignment: 'Assignment', inventory: 'Inventory', leave: 'Leave', payroll: 'Payroll', compliance: 'Compliance', settings: 'Settings', people: 'People', visit: 'Site Visits', calendar: 'Calendar', auth: 'Sign-ins' }

export default function Audit() {
  const { state } = useStore()
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('')
  const [who, setWho] = useState('')
  const [limit, setLimit] = useState(40)
  const list = state.audit.filter((a) => (!cat || a.category === cat) && (!who || a.by === who) && `${a.action} ${a.detail}`.toLowerCase().includes(q.toLowerCase()))
  const exp = () => downloadCSV(`audit-log-${todayISO()}.csv`, list.map((a) => ({ Time: fmtDateTime(a.at), User: userById(state, a.by)?.name || 'System', Action: a.action, Detail: a.detail, Category: CATS[a.category] || a.category })))
  return (
    <div className="page">
      <SectionHead title="Audit Log" subtitle="A permanent record of sensitive actions and system activity">
        <button className="btn btn-ghost" onClick={exp}><Download size={15} /> Export CSV</button>
      </SectionHead>
      <div className="card">
        <div className="toolbar">
          <div className="search-input"><Search size={15} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search actions…" /></div>
          <select className="w-auto" value={cat} onChange={(e) => setCat(e.target.value)}><option value="">All categories</option>{Object.entries(CATS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
          <select className="w-auto" value={who} onChange={(e) => setWho(e.target.value)}><option value="">All users</option>{state.users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</select>
        </div>
        {!list.length ? <Empty icon={ScrollText} title="No matching entries" /> : (
          <ul className="audit">
            {list.slice(0, limit).map((a) => {
              const u = userById(state, a.by)
              return (
                <li key={a.id}>
                  <Avatar name={u?.name || 'System'} size={30} />
                  <div className="grow"><b className="small">{a.action}</b> <Badge tone="gray">{CATS[a.category] || a.category}</Badge><div className="small">{a.detail}</div><div className="muted tiny">by {u?.name || 'System'}</div></div>
                  <span className="muted tiny nowrap">{fmtDateTime(a.at)}</span>
                </li>
              )
            })}
          </ul>
        )}
        {list.length > limit && <button className="btn btn-ghost btn-block" onClick={() => setLimit(limit + 40)}>Load more ({list.length - limit} more)</button>}
      </div>
    </div>
  )
}
