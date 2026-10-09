import { useMemo, useRef, useState } from 'react'
import { Search, Flag, Plus, Activity, Phone, Pencil, Filter, Download, MapPin, User, Calendar, ChevronLeft, ChevronRight, X, Users } from 'lucide-react'
import { useStore, visibleLeads, userById } from '../store'
import { Stat, Badge, Empty } from '../components/ui'
import { LeadFormModal, LogActivityModal, RaiseFlagModal } from '../components/forms'
import { STAGES, SOURCES, LEAD_STATUS, OFFICES } from '../data/constants'
import { fmtDate, todayISO, tempFromScore, downloadCSV, fmtMoney } from '../lib/utils'
import { go } from '../components/Layout'

const PAGE = 10
export const tempTone = (s) => (s >= 75 ? 'red' : s >= 45 ? 'amber' : 'blue')

export default function Leads() {
  const { state, me, actions } = useStore()
  const all = visibleLeads(state, me)
  const [q, setQ] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [fl, setFl] = useState({ status: 'active', stage: '', temp: '', source: '', office: '', agent: '' })
  const [page, setPage] = useState(1)
  const [sel, setSel] = useState([])
  const [bulk, setBulk] = useState('')
  const [modal, setModal] = useState(null)
  const [editLead, setEditLead] = useState(null)
  const timer = useRef(null)

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    return all.filter((l) => {
      if (s && !`${l.name} ${l.phone} ${l.email} ${l.id}`.toLowerCase().includes(s)) return false
      if (fl.status && l.status !== fl.status) return false
      if (fl.stage !== '' && l.stage !== Number(fl.stage)) return false
      if (fl.temp && tempFromScore(l.score) !== fl.temp) return false
      if (fl.source && l.source !== fl.source) return false
      if (fl.office && l.office !== fl.office) return false
      if (fl.agent && (fl.agent === 'none' ? l.assignedTo : l.assignedTo !== fl.agent)) return false
      return true
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }, [all, q, fl])

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE))
  const cur = Math.min(page, pages)
  const rows = filtered.slice((cur - 1) * PAGE, cur * PAGE)
  const month = todayISO().slice(0, 7)
  const visitsScheduled = state.visits.filter((v) => v.status === 'scheduled' && (!v.leadId || all.some((l) => l.id === v.leadId))).length
  const activeFilters = Object.entries(fl).filter(([k, v]) => v !== '' && !(k === 'status' && v === 'active')).length
  const agents = state.users.filter((u) => u.role !== 'admin' && (me.role === 'admin' || u.office === me.office))

  const toggle = (id) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
  const pressStart = (id) => { timer.current = setTimeout(() => { toggle(id); timer.current = 'fired' }, 500) }
  const pressEnd = () => { if (timer.current && timer.current !== 'fired') clearTimeout(timer.current) }
  const open = (id) => {
    if (timer.current === 'fired') { timer.current = null; return }
    if (sel.length) return toggle(id)
    go(`lead/${id}`)
  }
  const exportCSV = () => downloadCSV(`leads-${todayISO()}.csv`, filtered.map((l) => ({
    ID: l.id, Name: l.name, Phone: l.phone, Email: l.email, Source: l.source, Office: l.office, Stage: STAGES[l.stage],
    Status: LEAD_STATUS[l.status].label, Score: l.score, Budget: l.budget ? `${l.currency} ${l.budget}` : '', AssignedTo: userById(state, l.assignedTo)?.name || 'Unassigned',
    Created: fmtDate(l.createdAt), FollowUp: l.followUp || '',
  })))

  return (
    <div className="page">
      <div className="stats-4">
        <Stat accent label="Total Leads" value={all.length} hint={me.role === 'admin' ? 'Across the company' : me.role === 'manager' ? `${me.office} office pipeline` : 'Assigned to you'} onClick={() => setFl({ ...fl, status: '', stage: '' })} />
        <Stat label="New" value={all.filter((l) => l.stage === 0 && l.status === 'active').length} hint="First contact needed" onClick={() => setFl({ ...fl, status: 'active', stage: '0' })} />
        <Stat label="Site Visits" value={visitsScheduled} hint="Scheduled" onClick={() => go('site-visits')} />
        <Stat label="Closed" value={all.filter((l) => l.status === 'won' && (l.closedAt || '').slice(0, 7) === month).length} hint="This month" onClick={() => setFl({ ...fl, status: 'won', stage: '' })} />
      </div>

      <div className="card">
        <div className="toolbar">
          <div className="search-input">
            <Search size={15} />
            <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1) }} placeholder="Search name, phone, email or ID…" />
            {q && <button className="icon-btn sm" onClick={() => setQ('')}><X size={14} /></button>}
          </div>
          <button className={`btn btn-ghost ${showFilters ? 'active' : ''}`} onClick={() => setShowFilters(!showFilters)}><Filter size={15} /> Filters{activeFilters > 0 && <span className="tab-count">{activeFilters}</span>}</button>
          <button className="btn btn-ghost" onClick={exportCSV} title="Export CSV"><Download size={15} /><span className="hide-sm">Export</span></button>
          <button className="btn btn-ghost" onClick={() => setModal('flag')}><Flag size={15} /> Flag</button>
          <button className="btn btn-ghost" onClick={() => setModal('new')}><Plus size={15} /> New Lead</button>
          <button className="btn btn-gold" onClick={() => setModal('log')}><Activity size={15} /> Log Activity</button>
        </div>

        {showFilters && (
          <div className="filters">
            <select value={fl.status} onChange={(e) => { setFl({ ...fl, status: e.target.value }); setPage(1) }}>
              <option value="">All statuses</option>
              {Object.entries(LEAD_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <select value={fl.stage} onChange={(e) => { setFl({ ...fl, stage: e.target.value }); setPage(1) }}>
              <option value="">All stages</option>
              {STAGES.map((s, i) => <option key={s} value={i}>{i + 1}. {s}</option>)}
            </select>
            <select value={fl.temp} onChange={(e) => { setFl({ ...fl, temp: e.target.value }); setPage(1) }}>
              <option value="">Hot / Warm / Cold</option><option>Hot</option><option>Warm</option><option>Cold</option>
            </select>
            <select value={fl.source} onChange={(e) => { setFl({ ...fl, source: e.target.value }); setPage(1) }}>
              <option value="">All sources</option>{SOURCES.map((s) => <option key={s}>{s}</option>)}
            </select>
            {me.role === 'admin' && (
              <select value={fl.office} onChange={(e) => { setFl({ ...fl, office: e.target.value }); setPage(1) }}>
                <option value="">Both offices</option>{OFFICES.map((s) => <option key={s}>{s}</option>)}
              </select>
            )}
            {me.role !== 'executive' && (
              <select value={fl.agent} onChange={(e) => { setFl({ ...fl, agent: e.target.value }); setPage(1) }}>
                <option value="">All agents</option><option value="none">Unassigned</option>
                {agents.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            )}
            <button className="link" onClick={() => setFl({ status: 'active', stage: '', temp: '', source: '', office: '', agent: '' })}>Clear</button>
          </div>
        )}

        {sel.length > 0 ? (
          <div className="bulk-bar">
            <b>{sel.length} selected</b>
            <select value={bulk} onChange={(e) => setBulk(e.target.value)}>
              <option value="">Change status to…</option>
              {Object.entries(LEAD_STATUS).filter(([k]) => k !== 'won' || me.role === 'admin').map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <button className="btn btn-primary btn-sm" disabled={!bulk} onClick={() => { actions.bulkStatus(sel, bulk); setSel([]); setBulk('') }}>Apply</button>
            <button className="link" onClick={() => setSel(rows.map((r) => r.id))}>Select page</button>
            <button className="link" onClick={() => setSel([])}>Clear</button>
          </div>
        ) : (
          <p className="muted tiny pad-x">Hold a lead for 0.5s (or tick its box) to select multiple for bulk status change.</p>
        )}

        {rows.length === 0 ? (
          <Empty icon={Users} title="No leads found" text={q || activeFilters ? 'Try a different search or clear the filters.' : 'Create your first lead to get started.'}
            action={<button className="btn btn-primary" onClick={() => setModal('new')}><Plus size={15} /> New Lead</button>} />
        ) : (
          <div className="lead-list">
            {rows.map((l) => {
              const agent = userById(state, l.assignedTo)
              const overdue = l.followUp && l.followUp < todayISO()
              const dueToday = l.followUp === todayISO()
              return (
                <div key={l.id} className={`lead-row ${sel.includes(l.id) ? 'selected' : ''}`}
                  onMouseDown={() => pressStart(l.id)} onMouseUp={pressEnd} onMouseLeave={pressEnd}
                  onTouchStart={() => pressStart(l.id)} onTouchEnd={pressEnd} onClick={() => open(l.id)}>
                  <input type="checkbox" className="row-check" checked={sel.includes(l.id)} onChange={() => toggle(l.id)} onClick={(e) => e.stopPropagation()} aria-label={`Select ${l.name}`} />
                  <div className="lead-main">
                    <div className="lead-name">{l.name} {(l.tags || []).includes('flagged') && <Flag size={13} className="text-red" />}<span className="muted tiny">{l.id}</span></div>
                    <div className="lead-meta">
                      <span><Phone size={12} /> {l.phone}</span>
                      {l.followUp && <span className={overdue ? 'text-red' : dueToday ? 'text-amber' : ''}><Calendar size={12} /> {overdue ? 'Overdue · ' : dueToday ? 'Today · ' : ''}{fmtDate(l.followUp)}</span>}
                    </div>
                    <div className="lead-meta">
                      <span><MapPin size={12} /> {l.office}</span>
                      <span><User size={12} /> {agent?.name || <i className="text-amber">Unassigned</i>}</span>
                      <span className="hide-sm">Created {fmtDate(l.createdAt)}</span>
                      {l.budget && <span className="hide-sm">{fmtMoney(l.budget, l.currency)}</span>}
                    </div>
                    <div className="lead-tags">
                      <Badge tone={tempTone(l.score)}>{tempFromScore(l.score)} · {l.score}</Badge>
                      <Badge tone="gold" dot>{STAGES[l.stage]}</Badge>
                      {l.status !== 'active' && <Badge tone={LEAD_STATUS[l.status].tone}>{LEAD_STATUS[l.status].label}</Badge>}
                      <Badge tone="gray">{l.source}</Badge>
                    </div>
                  </div>
                  <div className="lead-actions" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()}>
                    <a className="icon-btn" href={`tel:${l.phone.replace(/\s/g, '')}`} title="Call"><Phone size={15} /></a>
                    <button className="icon-btn" title="Edit" onClick={() => setEditLead(l)}><Pencil size={15} /></button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
        <div className="pager">
          <span className="muted small">Showing {filtered.length ? (cur - 1) * PAGE + 1 : 0}–{Math.min(cur * PAGE, filtered.length)} of {filtered.length}</span>
          <div className="pager-btns">
            <button className="icon-btn" disabled={cur <= 1} onClick={() => setPage(cur - 1)}><ChevronLeft size={16} /></button>
            <span className="small">Page {cur} of {pages}</span>
            <button className="icon-btn" disabled={cur >= pages} onClick={() => setPage(cur + 1)}><ChevronRight size={16} /></button>
          </div>
        </div>
      </div>

      <LeadFormModal open={modal === 'new'} onClose={() => setModal(null)} />
      <LeadFormModal open={!!editLead} lead={editLead} onClose={() => setEditLead(null)} />
      <LogActivityModal open={modal === 'log'} onClose={() => setModal(null)} />
      <RaiseFlagModal open={modal === 'flag'} onClose={() => setModal(null)} />
    </div>
  )
}
