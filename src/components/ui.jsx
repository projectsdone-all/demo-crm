import { useEffect, useState } from 'react'
import { X, Inbox } from 'lucide-react'
import { initials } from '../lib/utils'
import { useStore } from '../store'

export function Modal({ open, onClose, title, subtitle, children, footer, wide, size }) {
  useEffect(() => {
    if (!open) return
    const h = (e) => e.key === 'Escape' && onClose?.()
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className={`modal ${wide ? 'modal-wide' : ''} ${size === 'xl' ? 'modal-xl' : ''}`} role="dialog" aria-modal="true">
        <div className="modal-head">
          <div>
            <h3>{title}</h3>
            {subtitle && <p className="muted small">{subtitle}</p>}
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  )
}

export function Drawer({ open, onClose, title, children, footer }) {
  useEffect(() => {
    if (!open) return
    const h = (e) => e.key === 'Escape' && onClose?.()
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="overlay overlay-right" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <aside className="drawer" role="dialog" aria-modal="true">
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>
        <div className="drawer-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </aside>
    </div>
  )
}

export function Confirm({ open, onClose, onConfirm, title, message, confirmText = 'Confirm', danger, withInput, inputLabel, inputPlaceholder, required }) {
  const [val, setVal] = useState('')
  useEffect(() => { if (open) setVal('') }, [open])
  return (
    <Modal open={open} onClose={onClose} title={title}
      footer={<>
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} disabled={withInput && required && !val.trim()}
          onClick={() => { onConfirm(val.trim()); onClose() }}>{confirmText}</button>
      </>}>
      {message && <p className="muted">{message}</p>}
      {withInput && (
        <label className="field">
          <span>{inputLabel}</span>
          <textarea rows={3} value={val} placeholder={inputPlaceholder} onChange={(e) => setVal(e.target.value)} autoFocus />
        </label>
      )}
    </Modal>
  )
}

export function Badge({ tone = 'gray', children, dot }) {
  const c = typeof children === 'string' && children ? children[0].toUpperCase() + children.slice(1) : children
  return <span className={`badge badge-${tone}`}>{dot && <i className="dot" />}{c}</span>
}

export function Avatar({ name, size = 34, tone }) {
  const hue = [...(name || 'x')].reduce((a, c) => a + c.charCodeAt(0), 0) % 360
  return (
    <span className="avatar" style={{ width: size, height: size, fontSize: size * 0.36, background: tone || `hsl(${hue} 35% 92%)`, color: tone ? '#fff' : `hsl(${hue} 40% 30%)` }}>
      {initials(name)}
    </span>
  )
}

export function Stat({ label, value, hint, icon: Icon, accent, onClick }) {
  return (
    <div className={`stat card ${accent ? 'stat-accent' : ''} ${onClick ? 'clickable' : ''}`} onClick={onClick}>
      <div className="stat-top">
        <span className="eyebrow">{label}</span>
        {Icon && <Icon size={16} className="muted" />}
      </div>
      <div className="stat-value">{value}</div>
      {hint && <div className="muted small">{hint}</div>}
    </div>
  )
}

export function Empty({ icon: Icon = Inbox, title, text, action }) {
  return (
    <div className="empty">
      <div className="empty-icon"><Icon size={22} /></div>
      <h4>{title}</h4>
      {text && <p className="muted small">{text}</p>}
      {action}
    </div>
  )
}

export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map((t) => {
        const key = typeof t === 'string' ? t : t.key
        const label = typeof t === 'string' ? t : t.label
        return (
          <button key={key} role="tab" className={`tab ${value === key ? 'active' : ''}`} onClick={() => onChange(key)}>
            {label}
            {t.count != null && <span className="tab-count">{t.count}</span>}
          </button>
        )
      })}
    </div>
  )
}

export function Field({ label, required, children, hint }) {
  // only wrap in <label> when there is a single native control, so groups of buttons keep their own names
  const Tag = children && ['input', 'select', 'textarea'].includes(children.type) ? 'label' : 'div'
  return (
    <Tag className="field">
      <span>{label}{required && <b className="req"> *</b>}</span>
      {children}
      {hint && <small className="muted">{hint}</small>}
    </Tag>
  )
}

export function Toggle({ checked, onChange, disabled }) {
  return (
    <button type="button" className={`toggle ${checked ? 'on' : ''}`} disabled={disabled} onClick={() => onChange(!checked)} aria-pressed={checked}>
      <span />
    </button>
  )
}

export function SectionHead({ title, subtitle, children }) {
  return (
    <div className="section-head">
      <div>
        <h2>{title}</h2>
        {subtitle && <p className="muted small">{subtitle}</p>}
      </div>
      <div className="section-actions">{children}</div>
    </div>
  )
}

export function Toasts() {
  const { toasts } = useStore()
  return (
    <div className="toasts">
      {toasts.map((t) => <div key={t.id} className={`toast toast-${t.tone}`}>{t.msg}</div>)}
    </div>
  )
}

export function Bar({ value, max, tone = 'navy' }) {
  const pct = max ? Math.min(100, Math.round((value / max) * 100)) : 0
  return <div className="bar"><div className={`bar-fill bar-${tone}`} style={{ width: `${pct}%` }} /></div>
}

export function PropertyCover({ project, height = 120 }) {
  if (project?.cover) return <div className="cover" style={{ height, backgroundImage: `url(${project.cover})` }} />
  const h = project?.hue ?? 210
  return (
    <div className="cover cover-gen" style={{ height, background: `linear-gradient(135deg, hsl(${h} 45% 32%), hsl(${(h + 40) % 360} 50% 55%))` }}>
      <svg viewBox="0 0 200 80" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
        <g fill="rgba(255,255,255,.18)">
          <rect x="20" y="30" width="22" height="50" /><rect x="46" y="12" width="18" height="68" /><rect x="68" y="38" width="26" height="42" />
          <rect x="98" y="4" width="16" height="76" /><rect x="118" y="26" width="24" height="54" /><rect x="146" y="40" width="20" height="40" /><rect x="170" y="22" width="14" height="58" />
        </g>
      </svg>
      <span className="cover-label">{project?.zone}</span>
    </div>
  )
}
