import { useState } from 'react'
import { Search, UserPlus, Pencil, MessageSquare, Mail, Phone, Power } from 'lucide-react'
import { useStore } from '../store'
import { Tabs, Avatar, Badge, Modal, Field, Empty } from '../components/ui'
import { ROLES, OFFICES, COMPANY } from '../data/constants'
import { fmtDate } from '../lib/utils'
import { go } from '../components/Layout'

function PersonCard({ u, onClick, small }) {
  return (
    <button className={`org-node ${small ? 'sm' : ''} ${u.active ? '' : 'inactive'}`} onClick={onClick}>
      <Avatar name={u.name} size={small ? 30 : 38} tone={u.role === 'admin' ? '#C9A45C' : u.role === 'manager' ? '#1C2B4A' : undefined} />
      <div><b>{u.name}</b><span>{u.designation}</span></div>
    </button>
  )
}

export default function Org() {
  const { state, me, actions } = useStore()
  const [tab, setTab] = useState('chart')
  const [q, setQ] = useState('')
  const [office, setOffice] = useState('')
  const [view, setView] = useState(null)
  const [edit, setEdit] = useState(null)
  const isAdmin = me.role === 'admin'
  const users = state.users
  const admins = users.filter((u) => u.role === 'admin')
  const v = users.find((u) => u.id === view)
  const dir = users.filter((u) => (!office || u.office === office) && `${u.name} ${u.email} ${u.designation}`.toLowerCase().includes(q.toLowerCase()))
  const message = (id) => { const c = actions.openDirect(id); go(`messages/${c}`) }

  return (
    <div className="page">
      <div className="row-between wrap gap">
        <Tabs value={tab} onChange={setTab} tabs={[{ key: 'chart', label: 'Org Chart' }, { key: 'people', label: 'People Directory', count: users.length }]} />
        {isAdmin && <button className="btn btn-primary" onClick={() => setEdit({})}><UserPlus size={15} /> Add Team Member</button>}
      </div>

      {tab === 'chart' && (
        <div className="card org-chart">
          <div className="org-level">
            <div className="org-company">{COMPANY.name}</div>
          </div>
          <div className="org-level">{admins.map((u) => <PersonCard key={u.id} u={u} onClick={() => setView(u.id)} />)}</div>
          <div className="org-offices">
            {OFFICES.map((o) => {
              const mgrs = users.filter((u) => u.role === 'manager' && u.office === o)
              const execs = users.filter((u) => u.role === 'executive' && u.office === o)
              return (
                <div key={o} className="org-office">
                  <div className="org-office-head">{o === 'Dubai' ? '🇦🇪' : '🇮🇳'} {o} Office <span className="muted tiny">{mgrs.length + execs.length} people</span></div>
                  <div className="org-level">{mgrs.map((u) => <PersonCard key={u.id} u={u} onClick={() => setView(u.id)} />)}</div>
                  <div className="org-children">{execs.map((u) => <PersonCard small key={u.id} u={u} onClick={() => setView(u.id)} />)}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {tab === 'people' && (
        <div className="card">
          <div className="toolbar">
            <div className="search-input"><Search size={15} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search people…" /></div>
            <select className="w-auto" value={office} onChange={(e) => setOffice(e.target.value)}><option value="">All offices</option>{OFFICES.map((o) => <option key={o}>{o}</option>)}</select>
          </div>
          {!dir.length ? <Empty title="No people found" /> : (
            <div className="people-grid">
              {dir.map((u) => (
                <div key={u.id} className={`person ${u.active ? '' : 'inactive'}`} onClick={() => setView(u.id)}>
                  <Avatar name={u.name} size={44} />
                  <div className="grow">
                    <b>{u.name}</b>
                    <div className="small">{u.designation}</div>
                    <div className="muted tiny">{u.email}</div>
                    <div className="lead-tags">
                      <Badge tone={u.role === 'admin' ? 'gold' : u.role === 'manager' ? 'navy' : 'gray'}>{ROLES[u.role].label}</Badge>
                      <Badge tone={u.office === 'Dubai' ? 'amber' : 'blue'}>{u.office === 'Dubai' ? '🇦🇪' : '🇮🇳'} {u.office}</Badge>
                      {!u.active && <Badge tone="red">Inactive</Badge>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <Modal open={!!v} onClose={() => setView(null)} title={v?.name} subtitle={v && `${v.designation} · ${ROLES[v.role].label}`}
        footer={v && <>
          {isAdmin && v.id !== me.id && <button className="btn btn-ghost" onClick={() => { actions.updateUser(v.id, { active: !v.active }); }}><Power size={14} /> {v.active ? 'Deactivate' : 'Activate'}</button>}
          {isAdmin && <button className="btn btn-ghost" onClick={() => { setEdit(v); setView(null) }}><Pencil size={14} /> Edit</button>}
          {v.id !== me.id && <button className="btn btn-primary" onClick={() => message(v.id)}><MessageSquare size={14} /> Message</button>}
        </>}>
        {v && (
          <div className="kv-grid">
            <div><span className="eyebrow">Email</span><a href={`mailto:${v.email}`}><Mail size={12} /> {v.email}</a></div>
            <div><span className="eyebrow">Phone</span><a href={`tel:${v.phone.replace(/\s/g, '')}`}><Phone size={12} /> {v.phone}</a></div>
            <div><span className="eyebrow">Office</span><b>{v.office}</b></div>
            <div><span className="eyebrow">Department</span><b>{v.department}</b></div>
            <div><span className="eyebrow">Reports to</span><b>{users.find((x) => x.id === v.reportsTo)?.name || '—'}</b></div>
            <div><span className="eyebrow">Joined</span><b>{fmtDate(v.joined)}</b></div>
            <div><span className="eyebrow">Active leads</span><b>{state.leads.filter((l) => l.assignedTo === v.id && l.status === 'active').length}{v.capacity ? ` / ${v.capacity}` : ''}</b></div>
            <div><span className="eyebrow">Status</span><Badge tone={v.active ? 'green' : 'red'}>{v.active ? 'Active' : 'Inactive'}</Badge></div>
          </div>
        )}
      </Modal>
      {edit && <MemberForm user={edit.id ? edit : null} onClose={() => setEdit(null)} />}
    </div>
  )
}

function MemberForm({ user, onClose }) {
  const { state, actions } = useStore()
  const [f, setF] = useState(user ? { ...user } : { name: '', email: '', phone: '', role: 'executive', office: 'Bangalore', designation: 'CRM Executive', department: 'Sales', capacity: 12, reportsTo: '' })
  const [err, setErr] = useState('')
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const save = () => {
    if (!f.name.trim() || !/^\S+@\S+\.\S+$/.test(f.email)) return setErr('Name and a valid email are required.')
    if (state.users.some((u) => u.email.toLowerCase() === f.email.toLowerCase() && u.id !== user?.id)) return setErr('That email is already in use.')
    const data = { ...f, name: f.name.trim(), email: f.email.trim().toLowerCase(), capacity: f.role === 'admin' ? 0 : Number(f.capacity) || 12, reportsTo: f.reportsTo || (f.role === 'executive' ? state.users.find((u) => u.role === 'manager' && u.office === f.office)?.id : state.users.find((u) => u.role === 'admin')?.id) }
    if (user) actions.updateUser(user.id, data)
    else actions.addUser(data)
    onClose()
  }
  return (
    <Modal open onClose={onClose} title={user ? 'Edit Team Member' : 'Add Team Member'} subtitle={user ? '' : 'New members sign in with the demo password'} wide
      footer={<><button className="btn btn-ghost" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={save}>{user ? 'Save' : 'Add Member'}</button></>}>
      <div className="grid-2">
        <Field label="Full name" required><input value={f.name} onChange={set('name')} /></Field>
        <Field label="Work email" required><input value={f.email} onChange={set('email')} placeholder={`name@${COMPANY.domain}`} disabled={!!user} /></Field>
        <Field label="Phone"><input value={f.phone} onChange={set('phone')} /></Field>
        <Field label="Role">
          <select value={f.role} onChange={(e) => setF({ ...f, role: e.target.value, designation: ROLES[e.target.value].label })}>
            {Object.values(ROLES).map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
          </select>
        </Field>
        <Field label="Designation"><input value={f.designation} onChange={set('designation')} /></Field>
        <Field label="Office"><select value={f.office} onChange={set('office')}>{OFFICES.map((o) => <option key={o}>{o}</option>)}</select></Field>
        <Field label="Department"><input value={f.department} onChange={set('department')} /></Field>
        {f.role !== 'admin' && <Field label="Lead capacity"><input type="number" value={f.capacity} onChange={set('capacity')} /></Field>}
        <Field label="Reports to">
          <select value={f.reportsTo || ''} onChange={set('reportsTo')}>
            <option value="">Auto</option>
            {state.users.filter((u) => u.role !== 'executive' && u.id !== user?.id).map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </Field>
      </div>
      {err && <div className="alert alert-red mt">{err}</div>}
    </Modal>
  )
}
