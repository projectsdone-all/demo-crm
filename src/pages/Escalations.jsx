import { useState } from 'react'
import { ShieldAlert, Check, X } from 'lucide-react'
import { useStore, userById } from '../store'
import { Badge, Empty, Tabs, SectionHead, Modal, Field, Avatar } from '../components/ui'
import { STAGES } from '../data/constants'
import { timeAgo } from '../lib/utils'
import { go } from '../components/Layout'

export default function Escalations() {
  const { state, actions } = useStore()
  const [tab, setTab] = useState('pending')
  const [dec, setDec] = useState(null)
  const [to, setTo] = useState('')
  const list = state.escalations.filter((e) => (tab === 'pending' ? e.status === 'pending' : e.status !== 'pending'))
  const pending = state.escalations.filter((e) => e.status === 'pending').length
  const cur = state.escalations.find((e) => e.id === dec)
  const curLead = cur && state.leads.find((l) => l.id === cur.leadId)

  return (
    <div className="page">
      <SectionHead title="Escalation Requests" subtitle={`${pending} pending review`} />
      <Tabs value={tab} onChange={setTab} tabs={[{ key: 'pending', label: 'Pending', count: pending }, { key: 'done', label: 'Resolved' }]} />
      {list.length === 0 ? (
        <div className="card"><Empty icon={ShieldAlert} title="No escalation requests" text="When agents or managers request reassignment, it will appear here." /></div>
      ) : (
        <div className="stack">
          {list.map((e) => {
            const l = state.leads.find((x) => x.id === e.leadId)
            if (!l) return null
            const req = userById(state, e.requestedBy)
            const curAgent = userById(state, l.assignedTo)
            const sug = userById(state, e.suggestedTo)
            return (
              <div key={e.id} className="card">
                <div className="row-between wrap gap">
                  <div>
                    <button className="link h4" onClick={() => go(`lead/${l.id}`)}>{l.name}</button>
                    <div className="muted small">{STAGES[l.stage]} · {l.office} · currently with <b>{curAgent?.name || 'Unassigned'}</b></div>
                  </div>
                  <Badge tone={e.status === 'pending' ? 'amber' : e.status === 'approved' ? 'green' : 'red'}>{e.status}</Badge>
                </div>
                <div className="row gap-sm small mt-sm"><Avatar name={req?.name} size={24} /><span><b>{req?.name}</b> <span className="muted">requested {timeAgo(e.at)}</span></span></div>
                <p className="quote small">“{e.reason}”</p>
                {sug && <p className="small">Suggested agent: <b>{sug.name}</b></p>}
                {e.status === 'approved' && e.assignedTo && <p className="small text-green">Reassigned to {userById(state, e.assignedTo)?.name}</p>}
                {e.status === 'pending' && (
                  <div className="row gap-sm end">
                    <button className="btn btn-ghost text-red" onClick={() => actions.decideEscalation(e.id, false)}><X size={15} /> Reject</button>
                    <button className="btn btn-primary" onClick={() => { setDec(e.id); setTo(e.suggestedTo || '') }}><Check size={15} /> Approve & Reassign</button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
      <Modal open={!!cur} onClose={() => setDec(null)} title="Reassign lead" subtitle={curLead?.name}
        footer={<><button className="btn btn-ghost" onClick={() => setDec(null)}>Cancel</button><button className="btn btn-primary" disabled={!to} onClick={() => { actions.decideEscalation(cur.id, true, to); setDec(null) }}>Reassign</button></>}>
        <Field label="Assign to" required>
          <select value={to} onChange={(e) => setTo(e.target.value)}>
            <option value="">Select agent</option>
            {state.users.filter((u) => u.active && u.role !== 'admin' && u.office === curLead?.office && u.id !== curLead?.assignedTo).map((u) => (
              <option key={u.id} value={u.id}>{u.name} — {state.leads.filter((l) => l.assignedTo === u.id && l.status === 'active').length}/{u.capacity} leads</option>
            ))}
          </select>
        </Field>
      </Modal>
    </div>
  )
}
