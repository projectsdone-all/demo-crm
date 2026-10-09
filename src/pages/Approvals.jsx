import { useState } from 'react'
import { CheckSquare, RefreshCw, Check, X, ArrowRight } from 'lucide-react'
import { useStore, userById } from '../store'
import { Badge, Empty, Tabs, Confirm, SectionHead, Avatar } from '../components/ui'
import { STAGES } from '../data/constants'
import { fmtMoney, timeAgo, fmtDateTime } from '../lib/utils'
import { go } from '../components/Layout'

const STATUS = {
  pending_manager: { label: 'Pending · Sales Manager', tone: 'amber' },
  pending_admin: { label: 'Pending · Super Admin', tone: 'gold' },
  approved: { label: 'Approved & Closed', tone: 'green' },
  rejected: { label: 'Rejected', tone: 'red' },
  withdrawn: { label: 'Withdrawn', tone: 'gray' },
}

export default function Approvals() {
  const { state, me, actions, toast } = useStore()
  const [tab, setTab] = useState(me.role === 'executive' ? 'mine' : 'action')
  const [rej, setRej] = useState(null)
  const leadOf = (a) => state.leads.find((l) => l.id === a.leadId)

  const visible = state.approvals.filter((a) => {
    const l = leadOf(a)
    if (!l) return false
    if (me.role === 'admin') return true
    if (me.role === 'manager') return l.office === me.office || a.submittedBy === me.id
    return a.submittedBy === me.id || l.assignedTo === me.id
  })
  const needsMe = visible.filter((a) => (me.role === 'manager' && a.status === 'pending_manager') || (me.role === 'admin' && a.status.startsWith('pending')))
  const mine = visible.filter((a) => a.submittedBy === me.id)
  const lists = { action: needsMe, mine, all: visible }
  const list = (lists[tab] || []).slice().sort((a, b) => new Date(b.at) - new Date(a.at))
  const pendingCount = visible.filter((a) => a.status.startsWith('pending')).length
  const tabs = me.role === 'executive'
    ? [{ key: 'mine', label: 'Submitted by me', count: mine.length }, { key: 'all', label: 'All', count: visible.length }]
    : [{ key: 'action', label: 'Needs my approval', count: needsMe.length }, { key: 'mine', label: 'Submitted by me', count: mine.length }, { key: 'all', label: 'All', count: visible.length }]

  return (
    <div className="page">
      <SectionHead title="Approvals" subtitle={`${pendingCount} pending · CRM Executive → Sales Manager → Super Admin`}>
        <button className="btn btn-ghost" onClick={() => toast('Approvals are up to date', 'info')}><RefreshCw size={15} /> Refresh</button>
      </SectionHead>
      <Tabs tabs={tabs} value={tab} onChange={setTab} />
      {list.length === 0 ? (
        <div className="card"><Empty icon={CheckSquare} title="No approval requests" text="Submit a lead for approval from its detail page — it will appear here." /></div>
      ) : (
        <div className="stack">
          {list.map((a) => {
            const l = leadOf(a)
            const sub = userById(state, a.submittedBy)
            const canAct = (me.role === 'manager' && a.status === 'pending_manager' && l.office === me.office) || (me.role === 'admin' && a.status.startsWith('pending'))
            const step = a.status === 'pending_manager' ? 1 : a.status === 'pending_admin' ? 2 : a.status === 'approved' ? 3 : -1
            return (
              <div key={a.id} className="card approval">
                <div className="row-between wrap gap">
                  <div>
                    <button className="link h4" onClick={() => go(`lead/${l.id}`)}>{l.name}</button>
                    <div className="muted small">{STAGES[l.stage]} · {l.office} · {l.budget ? fmtMoney(l.budget, l.currency) : 'Budget —'}</div>
                  </div>
                  <Badge tone={STATUS[a.status].tone}>{STATUS[a.status].label}</Badge>
                </div>
                <div className="flow">
                  {['Submitted', 'Sales Manager', 'Super Admin'].map((s, i) => (
                    <span key={s} className={`flow-step ${step > i || step === 3 ? 'done' : ''} ${step === i ? 'current' : ''} ${a.status === 'rejected' ? 'rej' : ''}`}>
                      {step > i || step === 3 ? <Check size={12} /> : null}{s}{i < 2 && <ArrowRight size={12} className="flow-arrow" />}
                    </span>
                  ))}
                </div>
                <div className="row gap-sm small">
                  <Avatar name={sub?.name} size={24} /> <span><b>{sub?.name}</b> <span className="muted">submitted {timeAgo(a.at)}</span></span>
                </div>
                {a.note && <p className="quote small">“{a.note}”</p>}
                <details className="history">
                  <summary className="small muted">History ({a.history.length})</summary>
                  <ul>{a.history.map((h, i) => <li key={i} className="small"><b>{userById(state, h.by)?.name}</b> — {h.action} <span className="muted tiny">{fmtDateTime(h.at)}</span></li>)}</ul>
                </details>
                {canAct && (
                  <div className="row gap-sm end">
                    <button className="btn btn-ghost text-red" onClick={() => setRej(a.id)}><X size={15} /> Reject</button>
                    <button className="btn btn-primary" onClick={() => actions.decideApproval(a.id, true)}><Check size={15} /> {me.role === 'admin' ? 'Final Approve & Close Deal' : 'Approve & Forward'}</button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
      <Confirm open={!!rej} onClose={() => setRej(null)} danger title="Reject approval" confirmText="Reject" withInput required inputLabel="Reason (sent to the submitter)" inputPlaceholder="e.g. SPA draft missing, please re-upload"
        onConfirm={(v) => actions.decideApproval(rej, false, v)} />
    </div>
  )
}
