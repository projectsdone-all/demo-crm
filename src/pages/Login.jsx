import { useState } from 'react'
import { Eye, EyeOff, Sparkles } from 'lucide-react'
import { useStore } from '../store'
import { COMPANY, ROLES, DEMO_PASSWORD } from '../data/constants'
import { Modal } from '../components/ui'

const DEMO_LOGINS = [
  { role: 'admin', email: `admin@${COMPANY.domain}`, who: 'Riya Sharma' },
  { role: 'manager', email: `manager@${COMPANY.domain}`, who: 'Karan Mehta · Bangalore' },
  { role: 'executive', email: `executive@${COMPANY.domain}`, who: 'Arjun Nair · Bangalore' },
]

export default function Login() {
  const { actions } = useStore()
  const [role, setRole] = useState('admin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [forgot, setForgot] = useState(false)

  const submit = (e) => {
    e.preventDefault()
    setError('')
    if (!email.trim() || !password) return setError('Please enter your work email and password.')
    const err = actions.login(email, password, role)
    if (err) setError(err)
  }
  const fill = (d) => { setRole(d.role); setEmail(d.email); setPassword(DEMO_PASSWORD); setError('') }

  return (
    <div className="login-page">
      <div className="login-art" aria-hidden="true">
        <div className="login-art-inner">
          <div className="brand-mark big">{COMPANY.short}</div>
          <h2>Every lead, every deal, one place.</h2>
          <p>From first enquiry in Bangalore to the final signature in Dubai — your whole sales SOP, team and inventory in a single CRM.</p>
          <ul>
            <li>11-stage sales SOP with India → Dubai handover</li>
            <li>AI lead distribution & workload balancing</li>
            <li>Approvals, payroll sign-off, audit log & reports</li>
          </ul>
        </div>
      </div>
      <div className="login-panel">
        <form className="login-card" onSubmit={submit}>
          <div className="login-brand">
            <div className="brand-mark sm">{COMPANY.short}</div>
            <span>{COMPANY.name.toUpperCase()}</span>
          </div>
          <h1>Welcome</h1>
          <p className="muted">Select your role, then sign in with your registered work email</p>

          <div className="eyebrow mt">I am a…</div>
          <div className="role-grid">
            {Object.values(ROLES).map((r) => (
              <button type="button" key={r.key} className={`role-card ${role === r.key ? 'active' : ''}`} onClick={() => setRole(r.key)}>
                <b>{r.label}</b>
                <span>{r.desc}</span>
              </button>
            ))}
          </div>

          <label className="field">
            <span>Work email <b className="req">*</b></span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={`you@${COMPANY.domain}`} autoComplete="username" />
          </label>
          <label className="field">
            <span className="row-between">Password <button type="button" className="link" onClick={() => setForgot(true)}>Forgot password?</button></span>
            <div className="input-icon">
              <input type={show ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" autoComplete="current-password" />
              <button type="button" className="link" onClick={() => setShow(!show)}>{show ? <EyeOff size={14} /> : <Eye size={14} />} {show ? 'Hide' : 'Show'}</button>
            </div>
          </label>
          {error && <div className="alert alert-red">{error}</div>}
          <button className="btn btn-primary btn-block btn-lg" type="submit">Continue</button>

          <div className="demo-box">
            <div className="demo-box-head"><Sparkles size={15} /> Demo accounts — click to fill <span className="muted">(password: <code>{DEMO_PASSWORD}</code>)</span></div>
            {DEMO_LOGINS.map((d) => (
              <button type="button" key={d.role} className="demo-row" onClick={() => fill(d)}>
                <b>{ROLES[d.role].label}</b>
                <span>{d.email}</span>
                <small className="muted">{d.who}</small>
              </button>
            ))}
          </div>
          <p className="muted small center">Access issues? support@{COMPANY.domain}</p>
        </form>
      </div>

      <Modal open={forgot} onClose={() => setForgot(false)} title="Reset password"
        footer={<button className="btn btn-primary" onClick={() => setForgot(false)}>Got it</button>}>
        <p className="muted">In the live product, a secure reset link is emailed to the registered work address.</p>
        <p>This is a demo — every account uses the password <code>{DEMO_PASSWORD}</code>.</p>
      </Modal>
    </div>
  )
}
