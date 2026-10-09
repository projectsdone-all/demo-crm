import { useState } from 'react'
import { useStore, visibleLeads, userById } from '../store'
import { Badge, SectionHead } from '../components/ui'
import { STAGES, HANDOVER_STAGE } from '../data/constants'
import { tempFromScore, fmtMoney } from '../lib/utils'
import { tempTone } from './Leads'
import { go } from '../components/Layout'

export default function Pipeline() {
  const { state, me, actions, toast } = useStore()
  const [office, setOffice] = useState('')
  const [drag, setDrag] = useState(null)
  const [over, setOver] = useState(null)
  const leads = visibleLeads(state, me).filter((l) => l.status === 'active' && (!office || l.office === office))
  const drop = (stage) => {
    setOver(null)
    if (!drag) return
    const l = state.leads.find((x) => x.id === drag)
    setDrag(null)
    if (!l || l.stage === stage) return
    actions.setStage(l.id, stage)
    toast(`${l.name} moved to ${STAGES[stage]}${stage > HANDOVER_STAGE && l.office === 'Bangalore' ? ' (handed over to Dubai)' : ''}`)
  }
  return (
    <div className="page">
      <SectionHead title="Lead Pipeline" subtitle={`Leads across all SOP stages · ${leads.length} active · drag a card to move it`}>
        {me.role === 'admin' && (
          <select value={office} onChange={(e) => setOffice(e.target.value)} className="w-auto">
            <option value="">Both offices</option><option>Bangalore</option><option>Dubai</option>
          </select>
        )}
      </SectionHead>
      <div className="kanban">
        {STAGES.map((s, i) => {
          const col = leads.filter((l) => l.stage === i)
          const value = col.reduce((a, l) => a + (l.currency === 'AED' ? l.budget || 0 : (l.budget || 0) / 22.7), 0)
          return (
            <div key={s} className={`kcol ${over === i ? 'over' : ''} ${i > HANDOVER_STAGE ? 'kcol-dubai' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setOver(i) }} onDragLeave={() => setOver(null)} onDrop={() => drop(i)}>
              <div className="kcol-head">
                <div><span className="kcol-num">{i + 1}</span><b>{s}</b></div>
                <span className="kcount">{col.length}</span>
              </div>
              {value > 0 && <div className="muted tiny kcol-val">≈ {fmtMoney(Math.round(value), 'AED')}</div>}
              {i === HANDOVER_STAGE + 1 && <div className="kcol-flag">🇦🇪 Dubai team</div>}
              <div className="kcards">
                {col.map((l) => (
                  <div key={l.id} className="kcard" draggable onDragStart={() => setDrag(l.id)} onDragEnd={() => setDrag(null)} onClick={() => go(`lead/${l.id}`)}>
                    <b className="small">{l.name}</b>
                    <div className="muted tiny">{userById(state, l.assignedTo)?.name || 'Unassigned'} · {l.office}</div>
                    <div className="lead-tags">
                      <Badge tone={tempTone(l.score)}>{tempFromScore(l.score)} · {l.score}</Badge>
                      {l.budget && <span className="tiny muted">{fmtMoney(l.budget, l.currency)}</span>}
                    </div>
                  </div>
                ))}
                {!col.length && <div className="kempty">No leads</div>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
