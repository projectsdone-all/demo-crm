import { useState } from 'react'
import { UsersRound, Users, Trophy, AlarmClock, MessageSquare, Phone, Mail } from 'lucide-react'
import { useStore, teamOf } from '../store'
import { Stat, Badge, Avatar, Bar, Drawer } from '../components/ui'
import { STAGES, ROLES } from '../data/constants'
import { todayISO, fmtDate } from '../lib/utils'
import { go } from '../components/Layout'

export default function Team() {
  const { state, me, actions } = useStore()
  const team = teamOf(state, me)
  const ids = team.map((u) => u.id)
  const leads = state.leads.filter((l) => l.office === me.office || ids.includes(l.assignedTo))
  const [sel, setSel] = useState(null)
  const u = state.users.find((x) => x.id === sel)
  const stat = (id) => {
    const mine = state.leads.filter((l) => l.assignedTo === id)
    const active = mine.filter((l) => l.status === 'active')
    return { active: active.length, won: mine.filter((l) => l.status === 'won').length, overdue: active.filter((l) => l.followUp && l.followUp < todayISO()).length, all: mine.length }
  }
  const message = (id) => { const c = actions.openDirect(id); go(`messages/${c}`) }

  return (
    <div className="page">
      <div className="stats-4">
        <Stat accent label="Team Size" value={team.filter((x) => x.active).length} hint={`${me.office} office`} icon={UsersRound} onClick={() => go('org')} />
        <Stat label="Total Leads" value={leads.filter((l) => l.status === 'active').length} hint="In pipeline" icon={Users} onClick={() => go('leads')} />
        <Stat label="Conversions" value={leads.filter((l) => l.status === 'won').length} hint="Deals finalized" icon={Trophy} />
        <Stat label="Overdue Follow-ups" value={leads.filter((l) => l.status === 'active' && l.followUp && l.followUp < todayISO()).length} hint="Need attention" icon={AlarmClock} />
      </div>
      <div className="card">
        <div className="card-head"><h3>Team Members</h3><span className="muted small">Click a member to see their pipeline</span></div>
        <div className="member-list">
          {team.map((m) => {
            const s = stat(m.id)
            return (
              <button key={m.id} className="member-row" onClick={() => setSel(m.id)}>
                <Avatar name={m.name} size={38} />
                <div className="grow">
                  <b>{m.name}</b>
                  <div className="muted small">{m.designation} · {m.email}</div>
                  {m.capacity > 0 && (
                    <div className="member-load">
                      <Bar value={s.active} max={m.capacity} tone={s.active / m.capacity > 0.9 ? 'red' : s.active / m.capacity > 0.7 ? 'amber' : 'green'} />
                      <span className="muted tiny">{s.active}/{m.capacity} capacity</span>
                    </div>
                  )}
                </div>
                <div className="member-stats hide-sm">
                  <span><b>{s.active}</b><small>Active</small></span>
                  <span><b>{s.won}</b><small>Won</small></span>
                  <span className={s.overdue ? 'text-red' : ''}><b>{s.overdue}</b><small>Overdue</small></span>
                </div>
                <Badge tone={m.office === 'Dubai' ? 'amber' : 'blue'}>{m.office}</Badge>
                <Badge tone={m.active ? 'green' : 'gray'}>{m.active ? 'Active' : 'Inactive'}</Badge>
              </button>
            )
          })}
        </div>
      </div>

      <Drawer open={!!u} onClose={() => setSel(null)} title={u?.name}>
        {u && (
          <>
            <div className="row gap mb">
              <Avatar name={u.name} size={54} />
              <div>
                <b>{u.designation}</b>
                <div className="muted small">{ROLES[u.role].label} · {u.office}</div>
                <div className="muted small">Joined {fmtDate(u.joined)} · ★ {u.rating}</div>
              </div>
            </div>
            <div className="row gap-sm mb">
              {u.id !== me.id && <button className="btn btn-primary btn-sm" onClick={() => message(u.id)}><MessageSquare size={14} /> Message</button>}
              <a className="btn btn-ghost btn-sm" href={`tel:${u.phone.replace(/\s/g, '')}`}><Phone size={14} /> Call</a>
              <a className="btn btn-ghost btn-sm" href={`mailto:${u.email}`}><Mail size={14} /> Email</a>
            </div>
            <h4 className="mb-sm">Pipeline ({state.leads.filter((l) => l.assignedTo === u.id && l.status === 'active').length} active)</h4>
            {state.leads.filter((l) => l.assignedTo === u.id).slice(0, 30).map((l) => (
              <button key={l.id} className="mini-row clickable" onClick={() => go(`lead/${l.id}`)}>
                <div className="grow"><b className="small">{l.name}</b><div className="muted tiny">{STAGES[l.stage]}</div></div>
                {l.status !== 'active' ? <Badge tone={l.status === 'won' ? 'green' : 'gray'}>{l.status}</Badge> : l.followUp && <span className={`tiny ${l.followUp < todayISO() ? 'text-red' : 'muted'}`}>{fmtDate(l.followUp)}</span>}
              </button>
            ))}
            {!state.leads.some((l) => l.assignedTo === u.id) && <p className="muted small">No leads assigned.</p>}
          </>
        )}
      </Drawer>
    </div>
  )
}
