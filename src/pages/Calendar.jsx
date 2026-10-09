import { useState } from 'react'
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react'
import { useStore, userById } from '../store'
import { Avatar, Modal, Field, SectionHead, Badge } from '../components/ui'
import { EVENT_TYPES, EVENT_CATEGORIES } from '../data/constants'
import { startOfWeek, addDays, toISODate, todayISO, fmtTime12, fmtDate } from '../lib/utils'

const HOURS = [...Array(13)].map((_, i) => 8 + i)
const MINS = ['00', '15', '30', '45']
const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m }
const TYPE_CLASS = { Call: 'ev-call', Meeting: 'ev-meeting', Review: 'ev-review', Personal: 'ev-personal', Blocked: 'ev-blocked' }

export default function Calendar() {
  const { state, me, actions } = useStore()
  const [week, setWeek] = useState(() => startOfWeek(new Date()))
  const [day, setDay] = useState(todayISO())
  const [form, setForm] = useState(null)
  const [view, setView] = useState(null)
  const people = [me, ...state.users.filter((u) => u.active && u.id !== me.id)]
  const days = [...Array(7)].map((_, i) => addDays(week, i))
  const evs = state.events.filter((e) => e.date === day)
  const nowMin = new Date().getHours() * 60 + new Date().getMinutes()
  const busyNow = (uid) => state.events.some((e) => e.userId === uid && e.date === todayISO() && e.busy && toMin(e.start) <= nowMin && toMin(e.end) > nowMin)
  const startForm = (start = '10:00') => {
    const h = Math.min(19, Number(start.slice(0, 2)))
    setForm({ title: '', type: 'Meeting', category: 'personal', date: day, sh: String(h).padStart(2, '0'), sm: '00', eh: String(h + 1).padStart(2, '0'), em: '00', busy: true, err: '' })
  }
  const save = () => {
    const start = `${form.sh}:${form.sm}`, end = `${form.eh}:${form.em}`
    if (!form.title.trim()) return setForm({ ...form, err: 'Give the event a title.' })
    if (toMin(end) <= toMin(start)) return setForm({ ...form, err: 'End time must be after start time.' })
    actions.addEvent({ title: form.title.trim(), type: form.type, category: form.category, date: form.date, start, end, busy: form.busy })
    setDay(form.date)
    setForm(null)
  }
  const ev = state.events.find((e) => e.id === view)
  const shift = (n) => { const w = addDays(week, 7 * n); setWeek(w); setDay(toISODate(w)) }

  return (
    <div className="page">
      <SectionHead title="Shared Calendar" subtitle="Company-wide schedule. Click an open slot in your column to schedule an event.">
        <button className="btn btn-ghost" onClick={() => { setWeek(startOfWeek(new Date())); setDay(todayISO()) }}>Today</button>
        <button className="btn btn-primary" onClick={() => startForm()}><Plus size={15} /> Add Event</button>
      </SectionHead>
      <div className="card">
        <div className="week-strip">
          <button className="icon-btn" onClick={() => shift(-1)} aria-label="Previous week"><ChevronLeft size={16} /></button>
          {days.map((d) => {
            const iso = toISODate(d)
            const n = state.events.filter((e) => e.date === iso).length
            return (
              <button key={iso} className={`day-pill ${iso === day ? 'active' : ''} ${iso === todayISO() ? 'today' : ''}`} onClick={() => setDay(iso)}>
                <span>{d.toLocaleDateString('en-GB', { weekday: 'short' })}</span>
                <b>{d.getDate()}</b>
                <span>{d.toLocaleDateString('en-GB', { month: 'short' })}</span>
                {n > 0 && <i>{n}</i>}
              </button>
            )
          })}
          <button className="icon-btn" onClick={() => shift(1)} aria-label="Next week"><ChevronRight size={16} /></button>
        </div>
        <div className="cal-scroll">
          <div className="cal-grid" style={{ gridTemplateColumns: `64px repeat(${people.length}, minmax(120px, 1fr))` }}>
            <div className="cal-corner" />
            {people.map((p) => (
              <div key={p.id} className="cal-person">
                <Avatar name={p.name} size={28} />
                <div><b>{p.id === me.id ? 'You' : p.name.split(' ')[0]}</b><span className={busyNow(p.id) ? 'text-red' : 'text-green'}>{busyNow(p.id) ? '🔴 Busy' : '🟢 Free'}</span></div>
              </div>
            ))}
            <div className="cal-times">{HOURS.map((h) => <div key={h} className="cal-time">{fmtTime12(`${h}:00`)}</div>)}</div>
            {people.map((p) => (
              <div key={p.id} className={`cal-col ${p.id === me.id ? 'mine' : ''}`}>
                {HOURS.map((h) => (
                  <div key={h} className="cal-slot" onClick={() => p.id === me.id && startForm(`${String(h).padStart(2, '0')}:00`)} title={p.id === me.id ? 'Add event' : ''} />
                ))}
                {evs.filter((e) => e.userId === p.id).map((e) => {
                  const top = ((toMin(e.start) - 480) / 60) * 48
                  const height = Math.max(22, ((toMin(e.end) - toMin(e.start)) / 60) * 48 - 3)
                  const hidden = p.id !== me.id && e.type === 'Personal'
                  return (
                    <button key={e.id} className={`cal-event ${TYPE_CLASS[e.type]}`} style={{ top, height }} onClick={(x) => { x.stopPropagation(); setView(e.id) }}>
                      <b>{hidden ? 'Busy' : e.title}</b><span>{fmtTime12(e.start)} – {fmtTime12(e.end)}</span>
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
        <div className="legend row gap wrap mt-sm">
          {EVENT_TYPES.map((t) => <span key={t} className="small"><i className={`legend-sq ${TYPE_CLASS[t]}`} />{t}</span>)}
          <span className="small"><i className="legend-sq mine-sq" />You</span>
        </div>
      </div>

      <Modal open={!!form} onClose={() => setForm(null)} title="Add Event" wide
        footer={<><button className="btn btn-ghost" onClick={() => setForm(null)}>Cancel</button><button className="btn btn-primary" onClick={save}>Save Event</button></>}>
        {form && (
          <>
            <Field label="Event for"><div className="row gap-sm"><Avatar name={me.name} size={28} /><b>{me.name}</b><Badge tone="gold">You</Badge></div></Field>
            <p className="muted tiny">Events are created in your personal calendar and visible company-wide.</p>
            <Field label="Category">
              <div className="cat-grid">
                {EVENT_CATEGORIES.map((c) => (
                  <button key={c.key} type="button" className={`role-card ${form.category === c.key ? 'active' : ''}`} onClick={() => setForm({ ...form, category: c.key, type: c.key === 'client' ? 'Meeting' : c.key === 'team' ? 'Call' : form.type })}>
                    <b>{c.icon} {c.label}</b><span>{c.desc}</span>
                  </button>
                ))}
              </div>
            </Field>
            <div className="grid-2">
              <Field label="Event Title" required><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Client call — Mr. Rao" autoFocus /></Field>
              <Field label="Type"><select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>{EVENT_TYPES.map((t) => <option key={t}>{t}</option>)}</select></Field>
              <Field label="Date"><input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
              <div className="grid-2">
                <Field label="Start time"><div className="row gap-xs"><select value={form.sh} onChange={(e) => setForm({ ...form, sh: e.target.value })}>{HOURS.map((h) => <option key={h}>{String(h).padStart(2, '0')}</option>)}</select>:<select value={form.sm} onChange={(e) => setForm({ ...form, sm: e.target.value })}>{MINS.map((m) => <option key={m}>{m}</option>)}</select></div></Field>
                <Field label="End time"><div className="row gap-xs"><select value={form.eh} onChange={(e) => setForm({ ...form, eh: e.target.value })}>{HOURS.map((h) => <option key={h}>{String(h).padStart(2, '0')}</option>)}</select>:<select value={form.em} onChange={(e) => setForm({ ...form, em: e.target.value })}>{MINS.map((m) => <option key={m}>{m}</option>)}</select></div></Field>
              </div>
            </div>
            <label className="check"><input type="checkbox" checked={form.busy} onChange={(e) => setForm({ ...form, busy: e.target.checked })} /> Visible to everyone as Busy</label>
            {form.err && <div className="alert alert-red mt-sm">{form.err}</div>}
          </>
        )}
      </Modal>

      <Modal open={!!ev} onClose={() => setView(null)} title={ev && (ev.userId !== me.id && ev.type === 'Personal' ? 'Busy' : ev.title)}
        footer={ev?.userId === me.id && <button className="btn btn-ghost text-red" onClick={() => { actions.deleteEvent(ev.id); setView(null) }}><Trash2 size={14} /> Delete event</button>}>
        {ev && (
          <div className="kv-grid">
            <div><span className="eyebrow">Who</span><b>{userById(state, ev.userId)?.name}</b></div>
            <div><span className="eyebrow">When</span><b>{fmtDate(ev.date)}</b><span className="small">{fmtTime12(ev.start)} – {fmtTime12(ev.end)}</span></div>
            <div><span className="eyebrow">Type</span><b>{ev.type}</b></div>
            <div><span className="eyebrow">Category</span><b>{EVENT_CATEGORIES.find((c) => c.key === ev.category)?.label || '—'}</b></div>
          </div>
        )}
      </Modal>
    </div>
  )
}
