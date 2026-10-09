import { useState } from 'react'
import { Flag, Plus, Eye, CheckCircle2 } from 'lucide-react'
import { useStore, userById } from '../store'
import { Stat, Tabs, Badge, Empty, SectionHead, Confirm, Avatar } from '../components/ui'
import { RaiseFlagModal } from '../components/forms'
import { timeAgo } from '../lib/utils'

const uTone = { High: 'red', Medium: 'amber', Low: 'blue' }
const sTone = { open: 'red', acknowledged: 'amber', resolved: 'green' }

export default function Flags() {
  const { state, me, actions } = useStore()
  const [tab, setTab] = useState('all')
  const [open, setOpen] = useState(false)
  const [act, setAct] = useState(null)
  const scope = state.flags.filter((f) => {
    if (me.role === 'admin') return true
    if (me.role === 'manager') return userById(state, f.raisedBy)?.office === me.office || f.about === me.id || f.raisedBy === me.id
    return f.raisedBy === me.id
  })
  const list = scope.filter((f) => tab === 'all' || f.status === tab).sort((a, b) => new Date(b.at) - new Date(a.at))
  const canManage = me.role !== 'executive'
  return (
    <div className="page">
      <SectionHead title={me.role === 'admin' ? 'Company-wide Flags & Warnings' : 'Flags & Warnings'} subtitle={`${scope.filter((f) => f.status === 'open').length} open flags`}>
        <button className="btn btn-primary" onClick={() => setOpen(true)}><Plus size={15} /> Raise Flag</button>
      </SectionHead>
      {canManage && (
        <div className="stats-4">
          <Stat accent label="Total Flags" value={scope.length} />
          <Stat label="Open" value={scope.filter((f) => f.status === 'open').length} />
          <Stat label="High Severity" value={scope.filter((f) => f.urgency === 'High' && f.status !== 'resolved').length} />
          <Stat label="Resolved" value={scope.filter((f) => f.status === 'resolved').length} />
        </div>
      )}
      <Tabs value={tab} onChange={setTab} tabs={['all', 'open', 'acknowledged', 'resolved'].map((k) => ({ key: k, label: k[0].toUpperCase() + k.slice(1), count: k === 'all' ? scope.length : scope.filter((f) => f.status === k).length }))} />
      {list.length === 0 ? (
        <div className="card"><Empty icon={Flag} title={scope.length ? 'No flags in this category' : 'No flags raised yet'} text="Raise a flag when a client, workload or team member needs attention." /></div>
      ) : (
        <div className="stack">
          {list.map((f) => {
            const by = userById(state, f.raisedBy)
            const about = userById(state, f.about)
            return (
              <div key={f.id} className={`card flag-card flag-${f.urgency.toLowerCase()}`}>
                <div className="row-between wrap gap">
                  <div className="row gap-sm"><Avatar name={by?.name} size={30} /><div><b>{by?.name}</b><div className="muted tiny">{by?.designation} · {timeAgo(f.at)}</div></div></div>
                  <div className="row gap-sm"><Badge tone={uTone[f.urgency]}>{f.urgency}</Badge><Badge tone={sTone[f.status]}>{f.status}</Badge></div>
                </div>
                {about && <div className="small mt-sm">About: <b>{about.name}</b></div>}
                <p className="mt-sm">{f.text}</p>
                {f.notes.map((n, i) => <div key={i} className="note small"><b>{userById(state, n.by)?.name}:</b> {n.text} <span className="muted tiny">{timeAgo(n.at)}</span></div>)}
                {canManage && f.status !== 'resolved' && f.raisedBy !== me.id && (
                  <div className="row gap-sm end">
                    {f.status === 'open' && <button className="btn btn-ghost btn-sm" onClick={() => setAct({ id: f.id, status: 'acknowledged' })}><Eye size={14} /> Acknowledge</button>}
                    <button className="btn btn-primary btn-sm" onClick={() => setAct({ id: f.id, status: 'resolved' })}><CheckCircle2 size={14} /> Resolve</button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
      <RaiseFlagModal open={open} onClose={() => setOpen(false)} />
      <Confirm open={!!act} onClose={() => setAct(null)} title={act?.status === 'resolved' ? 'Resolve flag' : 'Acknowledge flag'} confirmText={act?.status === 'resolved' ? 'Resolve' : 'Acknowledge'}
        withInput inputLabel="Note (sent to the person who raised it)" inputPlaceholder="e.g. Spoke to the client, discount request declined" onConfirm={(v) => actions.updateFlag(act.id, act.status, v)} />
    </div>
  )
}
