import { Target, Trophy, Clock, Star, Wallet, Activity } from 'lucide-react'
import { useStore } from '../store'
import { Stat, Bar, Empty } from '../components/ui'
import { ColumnChart, HBarList, Donut, PALETTE } from '../components/charts'
import { STAGES, ACTIVITY_TYPES } from '../data/constants'
import { fmtINR, addDays, startOfWeek, todayISO } from '../lib/utils'

export default function Performance() {
  const { state, me } = useStore()
  const myLeads = state.leads.filter((l) => l.assignedTo === me.id)
  const myActs = state.activities.filter((a) => a.by === me.id)
  const worked = new Set(myActs.map((a) => a.leadId)).size
  const won = myLeads.filter((l) => l.status === 'won')
  const commission = won.reduce((a, l) => a + Math.round((l.dealValueAED || 0) * 22.7 * 0.01), 0)

  const responses = myLeads.map((l) => {
    const first = state.activities.filter((a) => a.leadId === l.id && a.by === me.id).sort((a, b) => new Date(a.at) - new Date(b.at))[0]
    return first ? Math.max(0.2, (new Date(first.at) - new Date(l.createdAt)) / 3600000) : null
  }).filter((x) => x != null && x < 72)
  const avgResp = responses.length ? responses.reduce((a, b) => a + b, 0) / responses.length : null

  const ws = startOfWeek(new Date())
  const weeks = [...Array(8)].map((_, i) => {
    const from = addDays(ws, -7 * (7 - i)); const to = addDays(from, 7)
    return { label: from.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }), value: myActs.filter((a) => new Date(a.at) >= from && new Date(a.at) < to).length }
  })
  const mix = ACTIVITY_TYPES.map((t, i) => ({ label: t, value: myActs.filter((a) => a.type === t).length, color: PALETTE[i] }))
  const stages = STAGES.map((s, i) => ({ label: s, value: myLeads.filter((l) => l.status === 'active' && l.stage === i).length })).filter((x) => x.value)
  const month = todayISO().slice(0, 7)
  const wonMonth = won.filter((l) => (l.closedAt || '').slice(0, 7) === month).length
  const target = me.role === 'manager' ? 4 : 2
  const actsMonth = myActs.filter((a) => a.at.slice(0, 7) === month).length

  if (!myLeads.length && !myActs.length) {
    return <div className="page"><div className="card"><Empty icon={Activity} title="No performance data yet" text="Your metrics — leads worked, conversions, response time and commission — appear once you start logging lead activity." /></div></div>
  }

  return (
    <div className="page">
      <div className="stats-4">
        <Stat accent label="Leads Worked" value={worked} hint={`${myLeads.filter((l) => l.status === 'active').length} active right now`} icon={Target} />
        <Stat label="Conversions" value={won.length} hint={`${myLeads.length ? Math.round((won.length / myLeads.length) * 100) : 0}% of assigned leads`} icon={Trophy} />
        <Stat label="Avg Response Time" value={avgResp == null ? '—' : avgResp < 1 ? `${Math.round(avgResp * 60)}m` : `${avgResp.toFixed(1)}h`} hint="Lead created → first touch" icon={Clock} />
        <Stat label="Client Rating" value={`${me.rating?.toFixed(1) || '—'} ★`} hint="From post-visit feedback" icon={Star} />
      </div>

      <div className="grid-dash">
        <div className="card">
          <div className="card-head"><h3>Activities logged — last 8 weeks</h3><span className="muted small">{myActs.length} total</span></div>
          <ColumnChart data={weeks} color="var(--gold)" />
        </div>
        <div className="card">
          <div className="card-head"><h3>This month's targets</h3></div>
          <div className="target">
            <div className="row-between small"><span>Deals closed</span><b>{wonMonth} / {target}</b></div>
            <Bar value={wonMonth} max={target} tone="green" />
          </div>
          <div className="target">
            <div className="row-between small"><span>Activities logged</span><b>{actsMonth} / 40</b></div>
            <Bar value={actsMonth} max={40} tone="gold" />
          </div>
          <div className="target">
            <div className="row-between small"><span>Follow-ups on time</span><b>{myLeads.filter((l) => l.status === 'active' && l.followUp && l.followUp >= todayISO()).length} / {myLeads.filter((l) => l.status === 'active').length}</b></div>
            <Bar value={myLeads.filter((l) => l.status === 'active' && l.followUp && l.followUp >= todayISO()).length} max={myLeads.filter((l) => l.status === 'active').length || 1} />
          </div>
          <div className="commission">
            <Wallet size={18} />
            <div><span className="eyebrow">Estimated commission</span><b>{fmtINR(commission)}</b><span className="muted tiny">1% of closed deal value</span></div>
          </div>
        </div>
      </div>

      <div className="grid-dash">
        <div className="card">
          <div className="card-head"><h3>My active leads by stage</h3></div>
          {stages.length ? <HBarList data={stages} /> : <p className="muted small">No active leads.</p>}
        </div>
        <div className="card">
          <div className="card-head"><h3>Activity mix</h3></div>
          <Donut data={mix} label={myActs.length} sub="activities" />
        </div>
      </div>
    </div>
  )
}
