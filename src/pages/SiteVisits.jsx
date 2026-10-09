import { useState } from 'react'
import { MapPin, Plus, Check, X, Clock, Building2, User } from 'lucide-react'
import { useStore, userById } from '../store'
import { Badge, Empty, Tabs, SectionHead, Confirm } from '../components/ui'
import { ScheduleVisitModal } from '../components/forms'
import { fmtDate, fmtTime12, todayISO } from '../lib/utils'
import { go } from '../components/Layout'

export default function SiteVisits() {
  const { state, me, actions } = useStore()
  const [tab, setTab] = useState('upcoming')
  const [open, setOpen] = useState(false)
  const [done, setDone] = useState(null)
  const [cancel, setCancel] = useState(null)
  const mine = state.visits.filter((v) => {
    if (me.role === 'admin') return true
    const assignee = userById(state, v.assignedTo)
    if (me.role === 'manager') return assignee?.office === me.office || v.createdBy === me.id
    return v.assignedTo === me.id || v.createdBy === me.id
  })
  const t = todayISO()
  const groups = {
    upcoming: mine.filter((v) => v.status === 'scheduled' && v.date >= t).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)),
    today: mine.filter((v) => v.status === 'scheduled' && v.date === t),
    past: mine.filter((v) => v.status !== 'scheduled' || v.date < t).sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time)),
  }
  const list = groups[tab]
  return (
    <div className="page">
      <SectionHead title="Site Visits" subtitle={me.role === 'admin' ? 'Company-wide site visit schedule' : me.role === 'manager' ? "Your team's site visit schedule" : 'Your site visit schedule'}>
        <button className="btn btn-primary" onClick={() => setOpen(true)}><Plus size={15} /> Schedule Visit</button>
      </SectionHead>
      <Tabs value={tab} onChange={setTab} tabs={[{ key: 'upcoming', label: 'All Upcoming', count: groups.upcoming.length }, { key: 'today', label: 'Today', count: groups.today.length }, { key: 'past', label: 'Past & Closed', count: groups.past.length }]} />
      {list.length === 0 ? (
        <div className="card"><Empty icon={MapPin} title="No site visits scheduled" text="Schedule a visit to show clients a project or sample flat." action={<button className="btn btn-primary" onClick={() => setOpen(true)}><Plus size={15} /> Schedule Visit</button>} /></div>
      ) : (
        <div className="visit-grid">
          {list.map((v) => {
            const p = state.projects.find((x) => x.id === v.projectId)
            const l = state.leads.find((x) => x.id === v.leadId)
            const a = userById(state, v.assignedTo)
            const overdue = v.status === 'scheduled' && v.date < t
            return (
              <div key={v.id} className="card visit">
                <div className="visit-date">
                  <span>{new Date(v.date + 'T00:00:00').toLocaleDateString('en-GB', { month: 'short' })}</span>
                  <b>{new Date(v.date + 'T00:00:00').getDate()}</b>
                </div>
                <div className="grow">
                  <div className="row-between"><b><Building2 size={14} /> {p?.name || 'Project'}</b>
                    <Badge tone={v.status === 'completed' ? 'green' : v.status === 'cancelled' ? 'red' : overdue ? 'amber' : 'blue'}>{overdue ? 'Overdue' : v.status}</Badge></div>
                  <div className="muted small"><Clock size={12} /> {fmtDate(v.date)} · {fmtTime12(v.time)}</div>
                  <div className="muted small"><MapPin size={12} /> {v.place}</div>
                  <div className="small"><User size={12} /> {l ? <button className="link" onClick={() => go(`lead/${l.id}`)}>{l.name}</button> : <span className="muted">No lead linked</span>} · with <b>{a?.name}</b></div>
                  {v.outcome && <p className="quote small">{v.outcome}</p>}
                  {v.status === 'scheduled' && (me.role !== 'executive' || v.assignedTo === me.id) && (
                    <div className="row gap-sm mt-sm">
                      <button className="btn btn-ghost btn-sm" onClick={() => setCancel(v.id)}><X size={14} /> Cancel</button>
                      <button className="btn btn-primary btn-sm" onClick={() => setDone(v.id)}><Check size={14} /> Mark Completed</button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
      <ScheduleVisitModal open={open} onClose={() => setOpen(false)} />
      <Confirm open={!!done} onClose={() => setDone(null)} title="Visit completed" confirmText="Save" withInput inputLabel="Outcome" inputPlaceholder="e.g. Client liked the 2BR, wants payment plan" onConfirm={(v) => actions.updateVisit(done, 'completed', v)} />
      <Confirm open={!!cancel} onClose={() => setCancel(null)} danger title="Cancel visit" confirmText="Cancel Visit" withInput inputLabel="Reason" inputPlaceholder="e.g. Client rescheduled" onConfirm={(v) => actions.updateVisit(cancel, 'cancelled', v)} />
    </div>
  )
}
