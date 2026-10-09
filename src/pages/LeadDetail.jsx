import { useState } from 'react'
import { ArrowLeft, Phone, MessageCircle, Mail, MapPin, Activity, Pencil, Check, Send, XCircle, Ban, RotateCcw, Plane, CalendarClock, UserCog, Trash2, Flag, ChevronRight, Building2 } from 'lucide-react'
import { useStore, userById } from '../store'
import { Badge, Avatar, Confirm, Modal, Field, Empty } from '../components/ui'
import { LeadFormModal, LogActivityModal, ScheduleVisitModal } from '../components/forms'
import { STAGES, HANDOVER_STAGE, LEAD_STATUS } from '../data/constants'
import { fmtDate, fmtDateTime, tempFromScore, fmtMoney, todayISO, fmtTime12, timeAgo } from '../lib/utils'
import { tempTone } from './Leads'
import { go } from '../components/Layout'

const ACT_ICON = { Call: Phone, Email: Mail, Whatsapp: MessageCircle, 'Site-Visit': MapPin, Note: Activity }

export default function LeadDetail({ id }) {
  const { state, me, actions } = useStore()
  const l = state.leads.find((x) => x.id === id)
  const [m, setM] = useState(null)
  const [rs, setRs] = useState('')
  const [assignTo, setAssignTo] = useState('')
  const [esc, setEsc] = useState({ reason: '', suggestedTo: '' })
  const [handTo, setHandTo] = useState('')

  if (!l) return <div className="page"><Empty title="Lead not found" text="It may have been deleted." action={<button className="btn btn-primary" onClick={() => go('leads')}>Back to Leads</button>} /></div>

  const canSee = me.role === 'admin' || (me.role === 'manager' && (l.office === me.office || l.assignedTo === me.id)) || l.assignedTo === me.id
  if (!canSee) return <div className="page"><Empty title="No access" text="This lead belongs to another team." action={<button className="btn btn-primary" onClick={() => go('leads')}>Back to Leads</button>} /></div>

  const agent = userById(state, l.assignedTo)
  const acts = state.activities.filter((a) => a.leadId === l.id).sort((a, b) => new Date(b.at) - new Date(a.at))
  const project = state.projects.find((p) => p.id === l.interestedProject)
  const visits = state.visits.filter((v) => v.leadId === l.id)
  const pendingApproval = state.approvals.find((a) => a.leadId === l.id && a.status.startsWith('pending'))
  const lastApproval = state.approvals.filter((a) => a.leadId === l.id).sort((a, b) => new Date(b.at) - new Date(a.at))[0]
  const active = l.status === 'active'
  const atHandover = l.stage === HANDOVER_STAGE && l.office === 'Bangalore'
  const canHandover = atHandover && me.role !== 'executive'
  const lastStage = l.stage === STAGES.length - 1
  const isManagerish = me.role !== 'executive'
  const assignable = state.users.filter((u) => u.active && u.role !== 'admin' && u.office === l.office)
  const dubaiAgents = state.users.filter((u) => u.active && u.role !== 'admin' && u.office === 'Dubai')
  const flagged = (l.tags || []).includes('flagged')
  const wa = l.phone.replace(/[^\d]/g, '')

  return (
    <div className="page">
      <button className="back-link" onClick={() => go('leads')}><ArrowLeft size={15} /> Back to {me.role === 'executive' ? 'My Leads' : 'Leads'}</button>

      <div className="detail-grid">
        <div className="detail-main">
          <div className="card lead-hero">
            <div className="row gap">
              <Avatar name={l.name} size={52} />
              <div className="grow">
                <h2 className="serif">{l.name} {flagged && <Flag size={16} className="text-red" />}</h2>
                <div className="lead-tags">
                  <Badge tone="gray">{l.source}</Badge>
                  <Badge tone={tempTone(l.score)}>{tempFromScore(l.score)} · {l.score}</Badge>
                  <Badge tone={LEAD_STATUS[l.status].tone}>{LEAD_STATUS[l.status].label}</Badge>
                  <Badge tone="navy">{l.office}</Badge>
                  <span className="muted tiny">{l.id}</span>
                </div>
                <div className="muted small mt-sm">{l.phone}{l.email && ` · ${l.email}`}</div>
              </div>
              <div className="hero-actions">
                <button className="icon-btn" title={flagged ? 'Unflag' : 'Flag lead'} onClick={() => actions.flagLead(l.id, !flagged)}><Flag size={16} className={flagged ? 'text-red' : ''} /></button>
                <button className="icon-btn" title="Edit" onClick={() => setM('edit')}><Pencil size={16} /></button>
                {me.role === 'admin' && <button className="icon-btn" title="Delete" onClick={() => setM('delete')}><Trash2 size={16} /></button>}
                {active && <button className="btn btn-gold" onClick={() => setM('log')}><Activity size={15} /> Log Activity</button>}
              </div>
            </div>
            <div className="info-grid">
              <div><span className="eyebrow">Budget</span><b>{l.budget ? fmtMoney(l.budget, l.currency) : '—'}</b></div>
              <div><span className="eyebrow">Property Type</span><b>{l.propertyType}</b></div>
              <div><span className="eyebrow">Location</span><b>{l.location || '—'}</b></div>
              <div><span className="eyebrow">Lead Created</span><b>{fmtDate(l.createdAt)}</b></div>
              <div><span className="eyebrow">Assigned To</span><b>{agent?.name || <span className="text-amber">Unassigned</span>}</b></div>
              <div><span className="eyebrow">Interested In</span><b>{project ? <button className="link" onClick={() => go('inventory')}>{project.name}</button> : '—'}</b></div>
            </div>
            {l.reason && <div className={`alert ${l.status === 'cancelled' ? 'alert-red' : 'alert-amber'} mt`}><b>{LEAD_STATUS[l.status].label}:</b> {l.reason}</div>}
            {l.status === 'won' && <div className="alert alert-green mt">🎉 Deal closed on {fmtDate(l.closedAt)}{l.dealValueAED ? ` · Deal value AED ${Number(l.dealValueAED).toLocaleString()}` : ''}</div>}
          </div>

          <div className="card">
            <div className="card-head"><h3>Activity Timeline</h3><span className="muted small">{acts.length} {acts.length === 1 ? 'entry' : 'entries'}</span></div>
            {acts.length === 0 ? <p className="muted small">No activity yet.</p> : (
              <ul className="timeline">
                {acts.map((a) => {
                  const Icon = ACT_ICON[a.type] || Activity
                  return (
                    <li key={a.id}>
                      <span className="tl-icon"><Icon size={13} /></span>
                      <div>
                        <div className="row-between"><b className="small">{a.type.toUpperCase()}</b><span className="muted tiny" title={fmtDateTime(a.at)}>{fmtDateTime(a.at)}</span></div>
                        <p className="small">{a.note}</p>
                        <span className="muted tiny">— {userById(state, a.by)?.name || 'System'}</span>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          {visits.length > 0 && (
            <div className="card">
              <div className="card-head"><h3>Site Visits</h3></div>
              {visits.map((v) => (
                <div key={v.id} className="mini-row">
                  <Building2 size={15} className="muted" />
                  <div className="grow"><b className="small">{state.projects.find((p) => p.id === v.projectId)?.name}</b><div className="muted tiny">{fmtDate(v.date)} · {fmtTime12(v.time)} · {v.place}</div></div>
                  <Badge tone={v.status === 'completed' ? 'green' : v.status === 'cancelled' ? 'red' : 'blue'}>{v.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="detail-side">
          <div className="card">
            <div className="card-head"><h3>Lead Status</h3></div>
            {active && (
              <div className="stack-sm">
                {pendingApproval ? (
                  <div className="alert alert-blue small">Awaiting {pendingApproval.status === 'pending_manager' ? 'Sales Manager' : 'Super Admin'} approval</div>
                ) : (
                  <button className="btn btn-primary btn-block" onClick={() => setM('approve')}><Send size={15} /> Submit for Approval</button>
                )}
                {lastApproval?.status === 'rejected' && !pendingApproval && <div className="alert alert-red small">Last approval was rejected: {lastApproval.history.at(-1)?.action.replace('Rejected: ', '')}</div>}
                <div className="row gap-sm">
                  <button className="btn btn-ghost grow" onClick={() => setM('unable')}><XCircle size={15} /> Unable to Close</button>
                  <button className="btn btn-ghost grow text-red" onClick={() => setM('cancel')}><Ban size={15} /> Cancel Lead</button>
                </div>
              </div>
            )}
            {!active && l.status !== 'won' && <button className="btn btn-ghost btn-block" onClick={() => actions.reopenLead(l.id)}><RotateCcw size={15} /> Reopen Lead</button>}

            <ol className="stepper">
              {STAGES.map((s, i) => {
                const done = i < l.stage || l.status === 'won'
                const current = i === l.stage && l.status !== 'won'
                return (
                  <li key={s} className={`${done ? 'done' : ''} ${current ? 'current' : ''} ${i === HANDOVER_STAGE + 1 ? 'dubai-start' : ''}`}>
                    <span className="step-dot">{done ? <Check size={12} /> : i + 1}</span>
                    <span className="step-label">{s}</span>
                    {isManagerish && active && !current && !done && i > l.stage && !(atHandover) && (
                      <button className="step-jump" title="Jump to this stage" onClick={() => actions.setStage(l.id, i)}><ChevronRight size={13} /></button>
                    )}
                  </li>
                )
              })}
            </ol>
            {active && !lastStage && !atHandover && (
              <button className="btn btn-primary btn-block" onClick={() => actions.advanceStage(l.id)}>Complete “{STAGES[l.stage]}” <ChevronRight size={15} /></button>
            )}
            {active && atHandover && (
              <div className="handover">
                <div className="row gap-sm"><Plane size={16} /><b>Ready for Dubai Handover</b></div>
                <p className="small muted">This lead has completed Property Finalization in Bangalore. Transfer it to the Dubai team to proceed with Dubai Paperwork Overview.</p>
                {canHandover ? (
                  <>
                    <select value={handTo} onChange={(e) => setHandTo(e.target.value)}>
                      <option value="">Auto-pick least busy Dubai agent</option>
                      {dubaiAgents.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                    <button className="btn btn-gold btn-block" onClick={() => setM('handover')}>Confirm Transfer to Dubai</button>
                  </>
                ) : <p className="small text-amber">Your Sales Manager will confirm the transfer.</p>}
              </div>
            )}
            {active && lastStage && !pendingApproval && <p className="small muted mt-sm">Final stage reached — submit for approval to close the deal.</p>}
          </div>

          {active && (
            <div className="card">
              <div className="card-head"><h3>Follow-up Due</h3></div>
              <div className="row-between">
                <div>
                  <b className={l.followUp && l.followUp < todayISO() ? 'text-red' : ''}>{l.followUp ? fmtDate(l.followUp) : 'Not scheduled'}</b>
                  <div className="muted tiny">{l.followUp && l.followUp < todayISO() ? 'Overdue' : 'Scheduled reminder'}</div>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => { setRs(l.followUp || todayISO()); setM('reschedule') }}><CalendarClock size={14} /> Reschedule</button>
              </div>
            </div>
          )}

          <div className="card">
            <div className="card-head"><h3>Quick Actions</h3></div>
            <div className="quick-grid">
              <a className="quick" href={`tel:${l.phone.replace(/\s/g, '')}`}><Phone size={17} />Call Client</a>
              <a className="quick" href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer"><MessageCircle size={17} />WhatsApp</a>
              <a className="quick" href={`mailto:${l.email}?subject=${encodeURIComponent('Your property enquiry')}`}><Mail size={17} />Send Email</a>
              <button className="quick" onClick={() => setM('visit')} disabled={!active}><MapPin size={17} />Schedule Site Visit</button>
            </div>
          </div>

          <div className="card">
            <div className="card-head"><h3>Assignment</h3></div>
            <div className="row gap-sm mb">
              {agent ? <><Avatar name={agent.name} size={30} /><div><b className="small">{agent.name}</b><div className="muted tiny">{agent.designation} · {agent.office}</div></div></> : <span className="text-amber small">Unassigned</span>}
            </div>
            {isManagerish ? (
              <div className="row gap-sm">
                <select value={assignTo} onChange={(e) => setAssignTo(e.target.value)} className="grow">
                  <option value="">Reassign to…</option>
                  {assignable.filter((u) => u.id !== l.assignedTo).map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
                <button className="btn btn-primary btn-sm" disabled={!assignTo} onClick={() => { actions.assignLead(l.id, assignTo); setAssignTo('') }}>Assign</button>
              </div>
            ) : null}
            {me.role !== 'admin' && <button className="btn btn-ghost btn-block mt-sm" onClick={() => { setEsc({ reason: '', suggestedTo: '' }); setM('escalate') }}><UserCog size={15} /> Request Reassignment</button>}
          </div>
        </div>
      </div>

      <LeadFormModal open={m === 'edit'} lead={l} onClose={() => setM(null)} />
      <LogActivityModal open={m === 'log'} leadId={l.id} onClose={() => setM(null)} />
      <ScheduleVisitModal open={m === 'visit'} leadId={l.id} onClose={() => setM(null)} />
      <Confirm open={m === 'approve'} onClose={() => setM(null)} title="Submit for Approval" confirmText="Submit"
        message={`Approval flow: CRM Executive → Sales Manager → Super Admin. ${me.role === 'executive' ? 'Your Sales Manager reviews first.' : 'This goes straight to the Super Admin.'}`}
        withInput inputLabel="Note for approver" inputPlaceholder="e.g. All documents received, deposit paid" onConfirm={(v) => actions.submitApproval(l.id, v)} />
      <Confirm open={m === 'unable'} onClose={() => setM(null)} title="Mark as Unable to Close" confirmText="Mark Unable to Close" withInput required inputLabel="Reason" inputPlaceholder="Why couldn't this deal close?" onConfirm={(v) => actions.markUnable(l.id, v)} />
      <Confirm open={m === 'cancel'} onClose={() => setM(null)} danger title="Cancel Lead" confirmText="Cancel Lead" withInput required inputLabel="Reason" inputPlaceholder="e.g. Duplicate enquiry, not interested" onConfirm={(v) => actions.cancelLead(l.id, v)} />
      <Confirm open={m === 'handover'} onClose={() => setM(null)} title="Transfer to Dubai team?" confirmText="Confirm Transfer"
        message={`${l.name} moves to the Dubai office at “Dubai Paperwork Overview” and is assigned to ${handTo ? userById(state, handTo)?.name : 'the least busy Dubai agent'}.`} onConfirm={() => actions.handover(l.id, handTo)} />
      <Confirm open={m === 'delete'} onClose={() => setM(null)} danger title="Delete lead permanently?" confirmText="Delete" message="This removes the lead and its activity history." onConfirm={() => { actions.deleteLead(l.id); go('leads') }} />
      <Modal open={m === 'reschedule'} onClose={() => setM(null)} title="Reschedule Follow-up"
        footer={<><button className="btn btn-ghost" onClick={() => setM(null)}>Cancel</button><button className="btn btn-primary" disabled={!rs} onClick={() => { actions.reschedule(l.id, rs); setM(null) }}>Save</button></>}>
        <Field label="Follow-up date"><input type="date" value={rs} min={todayISO()} onChange={(e) => setRs(e.target.value)} /></Field>
      </Modal>
      <Modal open={m === 'escalate'} onClose={() => setM(null)} title="Request Reassignment" subtitle="Sent to the Super Admin for review"
        footer={<><button className="btn btn-ghost" onClick={() => setM(null)}>Cancel</button><button className="btn btn-primary" disabled={!esc.reason.trim()} onClick={() => { actions.requestEscalation(l.id, esc.reason.trim(), esc.suggestedTo); setM(null) }}>Send Request</button></>}>
        <Field label="Reason" required><textarea rows={3} value={esc.reason} onChange={(e) => setEsc({ ...esc, reason: e.target.value })} placeholder="e.g. Client prefers an Arabic-speaking agent" /></Field>
        <Field label="Suggested agent (optional)">
          <select value={esc.suggestedTo} onChange={(e) => setEsc({ ...esc, suggestedTo: e.target.value })}>
            <option value="">No preference</option>
            {assignable.filter((u) => u.id !== l.assignedTo).map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </Field>
      </Modal>
      <span className="sr-only">{timeAgo(l.createdAt)}</span>
    </div>
  )
}
