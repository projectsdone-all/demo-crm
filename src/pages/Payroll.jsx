import { useState } from 'react'
import { Wallet, Check, X, Download, FilePlus2 } from 'lucide-react'
import { useStore, userById } from '../store'
import { SectionHead, Empty, Badge, Avatar, Stat, Confirm, Tabs, Modal } from '../components/ui'
import { downloadCSV } from '../lib/utils'

const inr = (n) => `₹${Number(n).toLocaleString('en-IN')}`
const tone = { pending: 'amber', approved: 'green', rejected: 'red' }

export default function Payroll() {
  const { state, actions } = useStore()
  const months = [...new Set(state.payroll.map((p) => p.month))]
  const [month, setMonth] = useState(months[months.length - 1] || '')
  const [tab, setTab] = useState('all')
  const [all, setAll] = useState(false)
  const [slip, setSlip] = useState(null)
  const curMonth = months.includes(month) ? month : months[months.length - 1]
  const rows = state.payroll.filter((p) => p.month === curMonth && (tab === 'all' || p.status === tab))
  const monthRows = state.payroll.filter((p) => p.month === curMonth)
  const total = monthRows.reduce((a, p) => a + p.net, 0)
  const pending = monthRows.filter((p) => p.status === 'pending')
  const exp = () => downloadCSV(`payroll-${curMonth.replace(' ', '-')}.csv`, monthRows.map((p) => {
    const u = userById(state, p.userId)
    return { Employee: u?.name, Office: u?.office, Designation: u?.designation, Base: p.base, Commission: p.commission, Incentive: p.incentive, Deductions: p.deductions, Net: p.net, Status: p.status }
  }))
  const s = state.payroll.find((p) => p.id === slip)
  const su = s && userById(state, s.userId)
  const thisMonth = new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })

  return (
    <div className="page">
      <SectionHead title="Payroll Sign-off" subtitle="Final approval of payroll records across both offices">
        {months.length > 0 && <select className="w-auto" value={curMonth} onChange={(e) => setMonth(e.target.value)}>{months.map((m) => <option key={m}>{m}</option>)}</select>}
        {!months.includes(thisMonth) && <button className="btn btn-ghost" onClick={() => { actions.runPayroll(); setMonth(thisMonth) }}><FilePlus2 size={15} /> Generate {thisMonth.split(' ')[0]}</button>}
        <button className="btn btn-ghost" onClick={exp} disabled={!monthRows.length}><Download size={15} /> Export</button>
        <button className="btn btn-primary" disabled={!pending.length} onClick={() => setAll(true)}><Check size={15} /> Approve all ({pending.length})</button>
      </SectionHead>
      {!monthRows.length ? <div className="card"><Empty icon={Wallet} title="No payroll records yet" text="Payroll records will appear here once submitted by HR." /></div> : (
        <>
          <div className="stats-4">
            <Stat accent label="Total Net Payout" value={inr(total)} hint={curMonth} />
            <Stat label="Employees" value={monthRows.length} />
            <Stat label="Pending Sign-off" value={pending.length} />
            <Stat label="Commissions" value={inr(monthRows.reduce((a, p) => a + p.commission, 0))} />
          </div>
          <Tabs value={tab} onChange={setTab} tabs={['all', 'pending', 'approved', 'rejected'].map((k) => ({ key: k, label: k[0].toUpperCase() + k.slice(1), count: k === 'all' ? monthRows.length : monthRows.filter((p) => p.status === k).length }))} />
          <div className="card">
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Employee</th><th className="hide-sm">Office</th><th>Base</th><th className="hide-sm">Commission</th><th className="hide-sm">Incentive</th><th className="hide-sm">Deductions</th><th>Net Pay</th><th>Status</th><th /></tr></thead>
                <tbody>
                  {rows.map((p) => {
                    const u = userById(state, p.userId)
                    return (
                      <tr key={p.id}>
                        <td><button className="row gap-sm link-plain" onClick={() => setSlip(p.id)}><Avatar name={u?.name} size={28} /><div className="left"><b>{u?.name}</b><div className="muted tiny">{u?.designation}</div></div></button></td>
                        <td className="hide-sm">{u?.office}</td>
                        <td>{inr(p.base)}</td><td className="hide-sm">{inr(p.commission)}</td><td className="hide-sm">{inr(p.incentive)}</td><td className="hide-sm text-red">−{inr(p.deductions)}</td>
                        <td><b>{inr(p.net)}</b></td>
                        <td><Badge tone={tone[p.status]}>{p.status}</Badge></td>
                        <td className="nowrap">
                          {p.status === 'pending' ? (
                            <>
                              <button className="icon-btn" title="Send back to HR" onClick={() => actions.decidePayroll(p.id, 'rejected')}><X size={15} /></button>
                              <button className="icon-btn text-green" title="Approve" onClick={() => actions.decidePayroll(p.id, 'approved')}><Check size={15} /></button>
                            </>
                          ) : <button className="link small" onClick={() => setSlip(p.id)}>Payslip</button>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
      <Confirm open={all} onClose={() => setAll(false)} title="Approve all pending payroll?" confirmText={`Approve ${pending.length} records`} message={`This signs off ${pending.length} payroll records for ${curMonth}.`} onConfirm={actions.approveAllPayroll} />
      <Modal open={!!s} onClose={() => setSlip(null)} title="Payslip" subtitle={s && `${su?.name} · ${s.month}`}
        footer={<button className="btn btn-primary" onClick={() => window.print()}>Print</button>}>
        {s && (
          <div className="payslip">
            <div className="row-between"><span>Base salary</span><b>{inr(s.base)}</b></div>
            <div className="row-between"><span>Sales commission</span><b>{inr(s.commission)}</b></div>
            <div className="row-between"><span>Incentive</span><b>{inr(s.incentive)}</b></div>
            <div className="row-between text-red"><span>Deductions (PF, tax)</span><b>−{inr(s.deductions)}</b></div>
            <hr />
            <div className="row-between big"><span>Net pay</span><b>{inr(s.net)}</b></div>
            <p className="muted tiny">Submitted by {s.submittedBy} · Status: {s.status}</p>
          </div>
        )}
      </Modal>
    </div>
  )
}
