import { useState } from 'react'
import { Plus, CalendarClock, Check, X } from 'lucide-react'
import { useStore, userById } from '../store'
import { Stat, Tabs, Badge, Modal, Field, Empty, SectionHead, Avatar } from '../components/ui'
import { LEAVE_TYPES } from '../data/constants'
import { fmtDate, daysBetween, todayISO, timeAgo } from '../lib/utils'

const tone = { pending: 'amber', approved: 'green', rejected: 'red', cancelled: 'gray' }

export default function Leave() {
  const { state, me, actions } = useStore()
  const approver = me.role !== 'executive'
  const [tab, setTab] = useState(approver ? 'approvals' : 'mine')
  const [open, setOpen] = useState(false)
  const [f, setF] = useState({ type: LEAVE_TYPES[0], from: '', to: '', reason: '' })
  const days = daysBetween(f.from, f.to)

  const scope = state.leaves.filter((l) => {
    if (me.role === 'admin') return true
    if (me.role === 'manager') return userById(state, l.userId)?.office === me.office
    return l.userId === me.id
  })
  const canDecide = (l) => l.status === 'pending' && l.userId !== me.id && (me.role === 'admin' || (me.role === 'manager' && userById(state, l.userId)?.role === 'executive'))
  const lists = {
    approvals: scope.filter(canDecide),
    all: scope,
    mine: state.leaves.filter((l) => l.userId === me.id),
  }
  const list = [...(lists[tab] || [])].sort((a, b) => new Date(b.at) - new Date(a.at))
  const base = approver ? scope : lists.mine
  const submit = () => { actions.applyLeave({ ...f, days, reason: f.reason.trim() }); setOpen(false); setF({ type: LEAVE_TYPES[0], from: '', to: '', reason: '' }) }
  const usedDays = lists.mine.filter((l) => l.status === 'approved').reduce((a, l) => a + l.days, 0)

  return (
    <div className="page">
      <SectionHead title="Leave Management" subtitle={approver ? 'Manage and approve leave requests across your team' : 'Apply for leave and track your requests in real time'}>
        <button className="btn btn-primary" onClick={() => setOpen(true)}><Plus size={15} /> Apply for Leave</button>
      </SectionHead>
      <div className="stats-4">
        <Stat accent label="Total Requests" value={base.length} />
        <Stat label="Pending" value={base.filter((l) => l.status === 'pending').length} />
        <Stat label="Approved" value={base.filter((l) => l.status === 'approved').length} />
        <Stat label="My balance" value={`${Math.max(0, 24 - usedDays)} days`} hint={`${usedDays} used of 24 this year`} />
      </div>
      <Tabs value={tab} onChange={setTab} tabs={approver
        ? [{ key: 'approvals', label: 'Pending Approvals', count: lists.approvals.length }, { key: 'all', label: 'All Leave Requests', count: lists.all.length }, { key: 'mine', label: 'My Requests', count: lists.mine.length }]
        : [{ key: 'mine', label: 'My Leave Requests', count: lists.mine.length }]} />
      <div className="card">
        {list.length === 0 ? (
          <Empty icon={CalendarClock} title="No leave requests found" text={tab === 'approvals' ? 'No pending leave requests require review at this time.' : 'You have not submitted any leave requests yet. Click “Apply for Leave” to create one.'} />
        ) : list.map((l) => {
          const u = userById(state, l.userId)
          return (
            <div key={l.id} className="leave-row">
              <Avatar name={u?.name} size={36} />
              <div className="grow">
                <div className="row gap-sm wrap"><b>{u?.name}</b><Badge tone="gray">{l.type}</Badge><Badge tone={tone[l.status]}>{l.status}</Badge></div>
                <div className="small">{fmtDate(l.from)} → {fmtDate(l.to)} · <b>{l.days} day{l.days > 1 ? 's' : ''}</b></div>
                <div className="muted small">{l.reason}</div>
                <div className="muted tiny">Applied {timeAgo(l.at)}{l.decidedBy && ` · ${l.status} by ${userById(state, l.decidedBy)?.name}`}</div>
              </div>
              {canDecide(l) && (
                <div className="row gap-sm">
                  <button className="btn btn-ghost btn-sm text-red" onClick={() => actions.decideLeave(l.id, false)}><X size={14} /> Reject</button>
                  <button className="btn btn-primary btn-sm" onClick={() => actions.decideLeave(l.id, true)}><Check size={14} /> Approve</button>
                </div>
              )}
              {l.userId === me.id && l.status === 'pending' && <button className="btn btn-ghost btn-sm" onClick={() => actions.cancelLeave(l.id)}>Withdraw</button>}
            </div>
          )
        })}
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="Apply for Leave"
        footer={<><button className="btn btn-ghost" onClick={() => setOpen(false)}>Cancel</button><button className="btn btn-primary" disabled={!f.from || !f.to || days < 1 || !f.reason.trim()} onClick={submit}>Submit Leave Request</button></>}>
        <Field label="Leave Type" required><select value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}>{LEAVE_TYPES.map((t) => <option key={t}>{t}</option>)}</select></Field>
        <div className="grid-2">
          <Field label="From Date" required><input type="date" min={todayISO()} value={f.from} onChange={(e) => setF({ ...f, from: e.target.value, to: f.to && f.to < e.target.value ? e.target.value : f.to })} /></Field>
          <Field label="To Date" required><input type="date" min={f.from || todayISO()} value={f.to} onChange={(e) => setF({ ...f, to: e.target.value })} /></Field>
        </div>
        <Field label="Number of Days"><input value={days ? `${days} day${days > 1 ? 's' : ''}` : '—'} readOnly /></Field>
        <Field label="Reason" required><textarea rows={3} value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} placeholder="Enter the reason for your leave..." /></Field>
      </Modal>
    </div>
  )
}
