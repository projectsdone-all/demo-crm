import { useEffect, useState } from 'react'
import { Modal, Field } from './ui'
import { useStore, visibleLeads } from '../store'
import { SOURCES, PROPERTY_TYPES, OFFICES, ACTIVITY_TYPES, STAGES } from '../data/constants'
import { todayISO } from '../lib/utils'

export function LeadFormModal({ open, onClose, lead, onSaved }) {
  const { state, me, actions } = useStore()
  const blank = { name: '', phone: '', email: '', source: SOURCES[0], propertyType: PROPERTY_TYPES[0], budget: '', currency: 'INR', location: '', interestedProject: '', office: me.office, assignedTo: '', score: 40 }
  const [f, setF] = useState(blank)
  const [err, setErr] = useState('')
  useEffect(() => {
    if (open) {
      setErr('')
      setF(lead ? { ...blank, ...lead, budget: lead.budget ?? '', assignedTo: lead.assignedTo || '' } : blank)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, lead])
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const agents = state.users.filter((u) => u.active && u.role !== 'admin' && (me.role === 'admin' || u.office === (f.office || me.office)))
  const save = () => {
    if (!f.name.trim()) return setErr('Client name is required.')
    if (!/^[+\d][\d\s-]{6,}$/.test(f.phone.trim())) return setErr('Enter a valid phone number.')
    if (f.email && !/^\S+@\S+\.\S+$/.test(f.email)) return setErr('Enter a valid email address.')
    const data = { ...f, name: f.name.trim(), phone: f.phone.trim(), budget: f.budget === '' ? null : Number(String(f.budget).replace(/[^\d.]/g, '')), assignedTo: f.assignedTo || null, score: Number(f.score) }
    if (lead) {
      actions.updateLead(lead.id, data)
      onSaved?.(lead.id)
    } else {
      const id = actions.addLead(data)
      onSaved?.(id)
    }
    onClose()
  }
  return (
    <Modal open={open} onClose={onClose} title={lead ? 'Edit Lead' : 'New Lead'} subtitle={lead ? lead.id : 'Add a new enquiry to the pipeline'} wide
      footer={<><button className="btn btn-ghost" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={save}>{lead ? 'Save Changes' : 'Create Lead'}</button></>}>
      <div className="grid-2">
        <Field label="Client Name" required><input value={f.name} onChange={set('name')} placeholder="Full name" autoFocus /></Field>
        <Field label="Phone" required><input value={f.phone} onChange={set('phone')} placeholder="Phone number" /></Field>
        <Field label="Email"><input value={f.email} onChange={set('email')} placeholder="Email address" /></Field>
        <Field label="Source"><select value={f.source} onChange={set('source')}>{SOURCES.map((s) => <option key={s}>{s}</option>)}</select></Field>
        <Field label="Property Type"><select value={f.propertyType} onChange={set('propertyType')}>{PROPERTY_TYPES.map((s) => <option key={s}>{s}</option>)}</select></Field>
        <Field label="Budget (optional)">
          <div className="input-group">
            <select value={f.currency} onChange={set('currency')} className="w-auto"><option>INR</option><option>AED</option></select>
            <input value={f.budget} onChange={set('budget')} placeholder={f.currency === 'INR' ? 'e.g. 15000000' : 'e.g. 850000'} inputMode="numeric" />
          </div>
        </Field>
        <Field label="Preferred Location"><input value={f.location} onChange={set('location')} placeholder="e.g. JVC, Dubai" /></Field>
        <Field label="Interested Project">
          <select value={f.interestedProject} onChange={set('interestedProject')}>
            <option value="">Not decided</option>
            {state.projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </Field>
        {me.role !== 'executive' && (
          <>
            <Field label="Office">
              <select value={f.office} onChange={set('office')} disabled={me.role !== 'admin'}>{OFFICES.map((o) => <option key={o}>{o}</option>)}</select>
            </Field>
            <Field label="Assign to" hint={!f.assignedTo ? (state.settings.autoAssign ? 'Auto-assign (round-robin) is ON' : 'Leave empty to keep unassigned') : ''}>
              <select value={f.assignedTo} onChange={set('assignedTo')}>
                <option value="">Unassigned</option>
                {agents.map((u) => <option key={u.id} value={u.id}>{u.name} — {u.designation}</option>)}
              </select>
            </Field>
          </>
        )}
        <Field label={`Lead Score: ${f.score}`}><input type="range" min="0" max="100" value={f.score} onChange={set('score')} /></Field>
      </div>
      {err && <div className="alert alert-red mt">{err}</div>}
    </Modal>
  )
}

export function LogActivityModal({ open, onClose, leadId }) {
  const { state, me, actions } = useStore()
  const leads = visibleLeads(state, me).filter((l) => l.status === 'active')
  const [f, setF] = useState({ type: 'Call', leadId: '', note: '', followUp: '' })
  useEffect(() => { if (open) setF({ type: 'Call', leadId: leadId || '', note: '', followUp: '' }) }, [open, leadId])
  const ok = f.leadId && f.note.trim()
  return (
    <Modal open={open} onClose={onClose} title="Log Activity"
      footer={<><button className="btn btn-ghost" onClick={onClose}>Cancel</button><button className="btn btn-primary" disabled={!ok} onClick={() => { actions.logActivity({ ...f, note: f.note.trim() }); onClose() }}>Log Activity</button></>}>
      <Field label="Activity Type">
        <div className="chip-row">
          {ACTIVITY_TYPES.map((t) => <button type="button" key={t} className={`chip ${f.type === t ? 'active' : ''}`} onClick={() => setF({ ...f, type: t })}>{t}</button>)}
        </div>
      </Field>
      <Field label="Select Lead" required>
        <select value={f.leadId} onChange={(e) => setF({ ...f, leadId: e.target.value })} disabled={!!leadId}>
          <option value="">Select a lead…</option>
          {leads.map((l) => <option key={l.id} value={l.id}>{l.name} — {STAGES[l.stage]}</option>)}
        </select>
      </Field>
      <Field label="Notes" required><textarea rows={3} value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} placeholder="Describe the activity…" /></Field>
      <Field label="Schedule Follow-up"><input type="date" min={todayISO()} value={f.followUp} onChange={(e) => setF({ ...f, followUp: e.target.value })} /></Field>
    </Modal>
  )
}

export function RaiseFlagModal({ open, onClose }) {
  const { state, me, actions } = useStore()
  const [f, setF] = useState({ urgency: 'Medium', text: '', about: '' })
  useEffect(() => { if (open) setF({ urgency: 'Medium', text: '', about: '' }) }, [open])
  const people = state.users.filter((u) => u.id !== me.id && u.active && (me.role === 'admin' || u.office === me.office))
  return (
    <Modal open={open} onClose={onClose} title="Raise a Flag" subtitle="Flag something to your manager and admin — a difficult client, workload concern, or anything worth their attention."
      footer={<><button className="btn btn-ghost" onClick={onClose}>Cancel</button><button className="btn btn-primary" disabled={!f.text.trim()} onClick={() => { actions.raiseFlag({ ...f, text: f.text.trim() }); onClose() }}>Submit Flag</button></>}>
      <Field label="Urgency">
        <div className="chip-row">
          {['Low', 'Medium', 'High'].map((u) => <button type="button" key={u} className={`chip chip-${u.toLowerCase()} ${f.urgency === u ? 'active' : ''}`} onClick={() => setF({ ...f, urgency: u })}>{u}</button>)}
        </div>
      </Field>
      {me.role !== 'executive' && (
        <Field label="About a team member (optional)">
          <select value={f.about} onChange={(e) => setF({ ...f, about: e.target.value })}>
            <option value="">— General —</option>
            {people.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </Field>
      )}
      <Field label="What's going on?" required><textarea rows={4} value={f.text} onChange={(e) => setF({ ...f, text: e.target.value })} placeholder="Describe the issue…" /></Field>
    </Modal>
  )
}

export function ScheduleVisitModal({ open, onClose, leadId, projectId }) {
  const { state, me, actions } = useStore()
  const [f, setF] = useState({})
  const leads = visibleLeads(state, me).filter((l) => l.status === 'active')
  useEffect(() => {
    if (open) {
      const l = state.leads.find((x) => x.id === leadId)
      setF({ projectId: projectId || l?.interestedProject || '', leadId: leadId || '', date: '', time: '11:00', place: '', assignedTo: me.role === 'executive' ? me.id : (l?.assignedTo || '') })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, leadId, projectId])
  const assignees = state.users.filter((u) => u.active && u.role !== 'admin' && (me.role === 'admin' || u.office === me.office))
  const ok = f.projectId && f.date && f.time && f.assignedTo
  return (
    <Modal open={open} onClose={onClose} title="Schedule Site Visit"
      footer={<><button className="btn btn-ghost" onClick={onClose}>Cancel</button><button className="btn btn-primary" disabled={!ok} onClick={() => { actions.addVisit({ ...f, place: f.place || state.projects.find((p) => p.id === f.projectId)?.name + ' sales gallery' }); onClose() }}>Schedule</button></>}>
      <Field label="Project" required>
        <select value={f.projectId || ''} onChange={(e) => setF({ ...f, projectId: e.target.value })}>
          <option value="">Select a project</option>
          {state.projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </Field>
      <Field label="Client / Lead">
        <select value={f.leadId || ''} onChange={(e) => setF({ ...f, leadId: e.target.value })} disabled={!!leadId}>
          <option value="">— Not linked to a lead —</option>
          {leads.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
      </Field>
      <div className="grid-2">
        <Field label="Date" required><input type="date" min={todayISO()} value={f.date || ''} onChange={(e) => setF({ ...f, date: e.target.value })} /></Field>
        <Field label="Time" required><input type="time" value={f.time || ''} onChange={(e) => setF({ ...f, time: e.target.value })} /></Field>
      </div>
      <Field label="Place"><input value={f.place || ''} onChange={(e) => setF({ ...f, place: e.target.value })} placeholder="e.g. Site address / meeting point" /></Field>
      <Field label="Assign to" required hint={me.role === 'executive' ? 'Visits you schedule are assigned to you' : 'A manager picks the agent, or choose yourself'}>
        <select value={f.assignedTo || ''} onChange={(e) => setF({ ...f, assignedTo: e.target.value })} disabled={me.role === 'executive'}>
          <option value="">Select a person</option>
          {assignees.map((u) => <option key={u.id} value={u.id}>{u.name} — {u.designation}</option>)}
        </select>
      </Field>
    </Modal>
  )
}
