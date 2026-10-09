import { useEffect, useState } from 'react'
import { RotateCcw, Save, Lock } from 'lucide-react'
import { useStore } from '../store'
import { Toggle, Field, Confirm, Avatar, Badge } from '../components/ui'
import { ROLES, DEMO_PASSWORD, COMPANY } from '../data/constants'

function Row({ title, desc, children }) {
  return (
    <div className="set-row">
      <div><b>{title}</b><div className="muted small">{desc}</div></div>
      <div>{children}</div>
    </div>
  )
}

export default function SettingsPage() {
  const { state, me, theme, actions } = useStore()
  const [s, setS] = useState(state.settings)
  const [p, setP] = useState({ name: me.name, phone: me.phone })
  const [reset, setReset] = useState(false)
  useEffect(() => setS(state.settings), [state.settings])
  const admin = me.role === 'admin'
  const dirty = JSON.stringify(s) !== JSON.stringify(state.settings)
  const set = (k) => (v) => setS({ ...s, [k]: v })

  return (
    <div className="page narrow">
      <div className="card">
        <div className="card-head"><h3>My Profile</h3></div>
        <div className="row gap mb">
          <Avatar name={me.name} size={52} tone="#1C2B4A" />
          <div><b>{me.name}</b><div className="muted small">{me.email}</div><Badge tone="gold">{ROLES[me.role].label}</Badge> <Badge tone="gray">{me.office}</Badge></div>
        </div>
        <div className="grid-2">
          <Field label="Full name"><input value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} /></Field>
          <Field label="Phone"><input value={p.phone} onChange={(e) => setP({ ...p, phone: e.target.value })} /></Field>
          <Field label="Registered email" hint="Your registered email can't be changed"><input value={me.email} disabled /></Field>
          <Field label="Designation"><input value={me.designation} disabled /></Field>
        </div>
        <div className="row end"><button className="btn btn-primary" disabled={!p.name.trim() || (p.name === me.name && p.phone === me.phone)} onClick={() => actions.updateProfile({ name: p.name.trim(), phone: p.phone })}>Save Profile</button></div>
      </div>

      <div className="card">
        <div className="card-head"><div><h3>Appearance</h3><p className="muted small">Choose how {COMPANY.name} CRM looks on this device</p></div></div>
        <Row title="Dark Mode" desc="Switch to a dark color scheme"><Toggle checked={theme === 'dark'} onChange={actions.toggleTheme} /></Row>
      </div>

      {me.role !== 'executive' && (
        <>
          <div className="card">
            <div className="card-head"><div><h3>Lead Assignment</h3><p className="muted small">Configure how new leads are distributed to agents</p></div>{!admin && <Badge tone="gray"><Lock size={11} /> Super Admin only</Badge>}</div>
            <Row title="Round-robin Auto-assignment" desc="New leads are automatically assigned to agents in rotation"><Toggle disabled={!admin} checked={s.roundRobin} onChange={set('roundRobin')} /></Row>
            <Row title="Auto-assign on Lead Creation" desc="Assign immediately when a lead enters the system"><Toggle disabled={!admin} checked={s.autoAssign} onChange={set('autoAssign')} /></Row>
            <Row title="Unassigned Lead Alert Threshold" desc="Hours before alert is triggered"><input type="number" min="1" className="w-80" disabled={!admin} value={s.unassignedHours} onChange={(e) => set('unassignedHours')(Number(e.target.value))} /></Row>
          </div>
          <div className="card">
            <div className="card-head"><div><h3>Notification Rules</h3><p className="muted small">Configure which alerts are sent and when</p></div>{!admin && <Badge tone="gray"><Lock size={11} /> Super Admin only</Badge>}</div>
            <Row title="Missed Follow-up Alerts" desc="Alert when lead has no activity for the set threshold"><Toggle disabled={!admin} checked={s.missedFollowup} onChange={set('missedFollowup')} /></Row>
            <Row title="Unassigned Lead Alerts" desc="Alert managers when leads remain unassigned"><Toggle disabled={!admin} checked={s.unassignedAlerts} onChange={set('unassignedAlerts')} /></Row>
            <Row title="Payroll Reminders" desc="Remind approvers of pending payroll actions"><Toggle disabled={!admin} checked={s.payrollReminders} onChange={set('payrollReminders')} /></Row>
            <Row title="Leave Request Alerts" desc="Notify managers of pending leave requests"><Toggle disabled={!admin} checked={s.leaveAlerts} onChange={set('leaveAlerts')} /></Row>
            <Row title="Follow-up Inactivity Threshold" desc="Hours of inactivity triggers missed-follow-up alert"><input type="number" min="1" className="w-80" disabled={!admin} value={s.inactivityHours} onChange={(e) => set('inactivityHours')(Number(e.target.value))} /></Row>
            {admin && (
              <div className="row gap-sm end mt">
                <button className="btn btn-ghost" onClick={actions.resetSettings}><RotateCcw size={14} /> Reset to Defaults</button>
                <button className="btn btn-primary" disabled={!dirty} onClick={() => actions.saveSettings(s)}><Save size={14} /> Save Settings</button>
              </div>
            )}
          </div>
        </>
      )}

      <div className="card demo-card">
        <div className="card-head"><div><h3>Demo Mode</h3><p className="muted small">Everything you do is saved in this browser only. Reset any time to start fresh.</p></div></div>
        <div className="small">
          <p>Demo logins (password <code>{DEMO_PASSWORD}</code>):</p>
          <ul className="demo-list">
            <li><b>Super Admin</b> — admin@{COMPANY.domain}</li>
            <li><b>Sales Manager (Bangalore)</b> — manager@{COMPANY.domain}</li>
            <li><b>Sales Manager (Dubai)</b> — manager.dubai@{COMPANY.domain}</li>
            <li><b>CRM Executive</b> — executive@{COMPANY.domain}</li>
          </ul>
        </div>
        <div className="row end"><button className="btn btn-danger" onClick={() => setReset(true)}><RotateCcw size={14} /> Reset demo data</button></div>
      </div>
      <Confirm open={reset} onClose={() => setReset(false)} danger title="Reset all demo data?" confirmText="Reset" message="All leads, messages, approvals and changes made in this browser will be replaced with fresh sample data." onConfirm={actions.resetDemo} />
    </div>
  )
}
