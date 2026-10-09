import { useEffect, useMemo, useRef, useState } from 'react'
import {
  LayoutDashboard, Users, BarChart3, CheckSquare, UsersRound, KanbanSquare, PieChart, Bot, MapPin, Building2,
  Network, CalendarDays, Flag, MessageSquare, Bell, Settings, LogOut, Menu, Search, Moon, Sun, ChevronDown,
  ShieldAlert, ScrollText, Wallet, FileBarChart, CalendarClock, MoreHorizontal, X, RotateCcw, User,
} from 'lucide-react'
import { useStore, visibleLeads } from '../store'
import { COMPANY, ROLES } from '../data/constants'
import { Avatar } from './ui'
import { longToday, timeAgo } from '../lib/utils'

export const PAGES = {
  'admin-dashboard': { title: 'Company Dashboard', icon: LayoutDashboard },
  leads: { title: 'Leads', icon: Users },
  performance: { title: 'My Performance', icon: BarChart3 },
  approvals: { title: 'Approvals', icon: CheckSquare },
  team: { title: 'Team Overview', icon: UsersRound },
  pipeline: { title: 'Lead Pipeline', icon: KanbanSquare },
  sources: { title: 'Source Performance', icon: PieChart },
  workload: { title: 'AI Lead Distribution', icon: Bot },
  escalations: { title: 'Escalations', icon: ShieldAlert },
  'site-visits': { title: 'Site Visits', icon: MapPin },
  inventory: { title: 'Property Inventory', icon: Building2 },
  org: { title: 'Org & People', icon: Network },
  leave: { title: 'Leave Management', icon: CalendarClock },
  flags: { title: 'Flags & Warnings', icon: Flag },
  audit: { title: 'Audit Log', icon: ScrollText },
  payroll: { title: 'Payroll Sign-off', icon: Wallet },
  reports: { title: 'Reports Center', icon: FileBarChart },
  calendar: { title: 'Shared Calendar', icon: CalendarDays },
  messages: { title: 'Interact', icon: MessageSquare },
  notifications: { title: 'Notifications', icon: Bell },
  settings: { title: 'Settings', icon: Settings },
  lead: { title: 'Lead Detail', icon: Users },
}

export const NAV = {
  executive: [
    { group: 'Pipeline', items: [['leads', 'My Leads'], 'performance', 'approvals'] },
    { group: 'Operations', items: ['site-visits', 'inventory'] },
    { group: 'Organisation', items: ['org', 'leave'] },
    { group: 'Compliance', items: ['flags'] },
    { group: null, items: ['calendar', 'messages', 'notifications', 'settings'] },
  ],
  manager: [
    { group: 'Pipeline', items: ['leads', 'performance', 'approvals'] },
    { group: 'Team', items: ['team', 'pipeline', 'sources', 'workload'] },
    { group: 'Operations', items: ['site-visits', 'inventory'] },
    { group: 'Organisation', items: ['org', 'leave'] },
    { group: 'Compliance', items: ['flags'] },
    { group: null, items: ['calendar', 'messages', 'notifications', 'settings'] },
  ],
  admin: [
    { group: 'Overview', items: ['admin-dashboard'] },
    { group: 'Pipeline', items: ['leads', 'pipeline', 'sources', ['workload', 'Workload & AI Assignment'], 'approvals', 'escalations'] },
    { group: 'Operations', items: ['site-visits', 'inventory'] },
    { group: 'Organisation', items: ['org', 'leave'] },
    { group: 'Compliance', items: ['flags', 'audit'] },
    { group: 'Finance', items: ['payroll', 'reports'] },
    { group: null, items: ['calendar', 'messages', 'notifications', 'settings'] },
  ],
}

export const HOME = { admin: 'admin-dashboard', manager: 'team', executive: 'leads' }

const BOTTOM = {
  executive: [['leads', 'Leads', Users], ['site-visits', 'Visits', MapPin], ['messages', 'Interact', MessageSquare], ['notifications', 'Alerts', Bell]],
  manager: [['leads', 'Leads', Users], ['team', 'Team', UsersRound], ['messages', 'Interact', MessageSquare], ['notifications', 'Alerts', Bell]],
  admin: [['admin-dashboard', 'Dashboard', LayoutDashboard], ['workload', 'Workload', Bot], ['messages', 'Interact', MessageSquare], ['notifications', 'Alerts', Bell]],
}

export const go = (route) => { window.location.hash = route }

function useBadges() {
  const { state, me } = useStore()
  return useMemo(() => {
    if (!me) return {}
    const b = {}
    b.notifications = state.notifications.filter((n) => n.userId === me.id && !n.read).length
    if (me.role === 'manager') b.approvals = state.approvals.filter((a) => a.status === 'pending_manager' && state.leads.find((l) => l.id === a.leadId)?.office === me.office).length
    if (me.role === 'admin') {
      b.approvals = state.approvals.filter((a) => a.status === 'pending_admin').length
      b.escalations = state.escalations.filter((e) => e.status === 'pending').length
      b.payroll = state.payroll.filter((p) => p.status === 'pending').length
    }
    if (me.role !== 'executive') {
      const team = state.users.filter((u) => me.role === 'admin' || u.office === me.office).map((u) => u.id)
      b.leave = state.leaves.filter((l) => l.status === 'pending' && team.includes(l.userId) && l.userId !== me.id).length
      b.flags = state.flags.filter((f) => f.status === 'open').length
      b.workload = visibleLeads(state, me).filter((l) => !l.assignedTo && l.status === 'active').length
    }
    const convs = state.conversations.filter((c) => c.members.includes(me.id)).map((c) => c.id)
    b.messages = state.notifications.filter((n) => n.userId === me.id && !n.read && n.link === '#messages').length
    return b
  }, [state, me])
}

function Sidebar({ route, open, onClose }) {
  const { me, actions } = useStore()
  const badges = useBadges()
  return (
    <>
      <div className={`sidebar-scrim ${open ? 'show' : ''}`} onClick={onClose} />
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="brand">
          <div className="brand-mark">{COMPANY.short}</div>
          <div>
            <div className="brand-name">{COMPANY.name.toUpperCase()}</div>
            <div className="brand-sub">{COMPANY.tagline}</div>
          </div>
          <button className="icon-btn sidebar-close" onClick={onClose} aria-label="Close menu"><X size={18} /></button>
        </div>
        <div className="role-pill">{ROLES[me.role].label}</div>
        <nav className="nav">
          {NAV[me.role].map((g, gi) => (
            <div key={gi} className="nav-group">
              {g.group && <div className="nav-label">{g.group}</div>}
              {g.items.map((it) => {
                const [key, label] = Array.isArray(it) ? it : [it, PAGES[it].title]
                const Icon = PAGES[key].icon
                const active = route === key || (route === 'lead' && key === 'leads')
                return (
                  <button key={key} className={`nav-item ${active ? 'active' : ''}`} onClick={() => { go(key); onClose() }}>
                    <Icon size={16} />
                    <span>{label}</span>
                    {badges[key] > 0 && <span className="nav-badge">{badges[key]}</span>}
                  </button>
                )
              })}
            </div>
          ))}
        </nav>
        <div className="sidebar-foot">
          <div className="me">
            <Avatar name={me.name} size={34} tone="#C9A45C" />
            <div>
              <div className="me-name">{me.name}</div>
              <div className="me-role">{ROLES[me.role].label}</div>
            </div>
          </div>
          <button className="nav-item" onClick={actions.logout}><LogOut size={16} /><span>Sign out</span></button>
        </div>
      </aside>
    </>
  )
}

function SearchPalette({ open, onClose }) {
  const { state, me } = useStore()
  const [q, setQ] = useState('')
  const inputRef = useRef(null)
  useEffect(() => { if (open) { setQ(''); setTimeout(() => inputRef.current?.focus(), 30) } }, [open])
  useEffect(() => {
    if (!open) return
    const h = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [open, onClose])
  if (!open) return null
  const s = q.trim().toLowerCase()
  const navKeys = NAV[me.role].flatMap((g) => g.items.map((it) => (Array.isArray(it) ? it : [it, PAGES[it].title])))
  const pages = navKeys.filter(([, t]) => !s || t.toLowerCase().includes(s)).slice(0, 6)
  const leads = s ? visibleLeads(state, me).filter((l) => `${l.name} ${l.phone} ${l.email} ${l.id}`.toLowerCase().includes(s)).slice(0, 6) : []
  const people = s ? state.users.filter((u) => `${u.name} ${u.email}`.toLowerCase().includes(s)).slice(0, 4) : []
  const props = s ? state.projects.filter((p) => `${p.name} ${p.developer} ${p.location}`.toLowerCase().includes(s)).slice(0, 4) : []
  const pick = (r) => { go(r); onClose() }
  return (
    <div className="overlay overlay-top" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="palette">
        <div className="palette-input">
          <Search size={18} className="muted" />
          <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search leads, people, properties or pages…" />
          <kbd>Esc</kbd>
        </div>
        <div className="palette-results">
          {leads.length > 0 && <div className="palette-group">Leads</div>}
          {leads.map((l) => (
            <button key={l.id} className="palette-item" onClick={() => pick(`lead/${l.id}`)}>
              <Users size={15} /> <span>{l.name}</span> <small className="muted">{l.phone} · {l.office}</small>
            </button>
          ))}
          {people.length > 0 && <div className="palette-group">People</div>}
          {people.map((u) => (
            <button key={u.id} className="palette-item" onClick={() => pick('org')}>
              <User size={15} /> <span>{u.name}</span> <small className="muted">{u.designation} · {u.office}</small>
            </button>
          ))}
          {props.length > 0 && <div className="palette-group">Properties</div>}
          {props.map((p) => (
            <button key={p.id} className="palette-item" onClick={() => pick(`inventory`)}>
              <Building2 size={15} /> <span>{p.name}</span> <small className="muted">{p.location}</small>
            </button>
          ))}
          {pages.length > 0 && <div className="palette-group">Pages</div>}
          {pages.map(([k, t]) => {
            const Icon = PAGES[k].icon
            return <button key={k} className="palette-item" onClick={() => pick(k)}><Icon size={15} /> <span>{t}</span></button>
          })}
          {s && !leads.length && !people.length && !props.length && !pages.length && <div className="muted small pad">No results for “{q}”.</div>}
        </div>
      </div>
    </div>
  )
}

function Header({ route, onMenu, onSearch }) {
  const { state, me, theme, actions } = useStore()
  const [bell, setBell] = useState(false)
  const [menu, setMenu] = useState(false)
  const mine = state.notifications.filter((n) => n.userId === me.id)
  const unread = mine.filter((n) => !n.read).length
  const title = route === 'workload' && me.role === 'admin' ? 'Workload & AI Assignment' : route === 'leads' && me.role === 'executive' ? 'My Leads' : PAGES[route]?.title || ''
  useEffect(() => {
    const close = () => { setBell(false); setMenu(false) }
    if (bell || menu) { document.addEventListener('click', close); return () => document.removeEventListener('click', close) }
  }, [bell, menu])
  return (
    <header className="topbar">
      <button className="icon-btn menu-btn" onClick={onMenu} aria-label="Open menu"><Menu size={20} /></button>
      <div className="topbar-title">
        <h1>{title}</h1>
        <div className="muted small">{longToday()}</div>
      </div>
      <button className="search-btn" onClick={onSearch}><Search size={15} /><span>Search</span><kbd>⌘K</kbd></button>
      <button className="icon-btn" onClick={actions.toggleTheme} aria-label="Toggle dark mode">{theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}</button>
      <div className="pop-wrap" onClick={(e) => e.stopPropagation()}>
        <button className="icon-btn" onClick={() => { setBell(!bell); setMenu(false) }} aria-label="Notifications">
          <Bell size={18} />{unread > 0 && <span className="bell-dot">{unread}</span>}
        </button>
        {bell && (
          <div className="popover">
            <div className="popover-head"><b>Notifications</b>{unread > 0 && <button className="link" onClick={actions.markAllRead}>Mark all read</button>}</div>
            {mine.slice(0, 6).map((n) => (
              <button key={n.id} className={`notif-row ${n.read ? '' : 'unread'}`} onClick={() => { actions.markRead(n.id); if (n.link) window.location.hash = n.link; setBell(false) }}>
                <div className="notif-title">{n.title}</div>
                <div className="muted small">{n.body}</div>
                <div className="muted tiny">{timeAgo(n.at)}</div>
              </button>
            ))}
            {!mine.length && <div className="pad muted small">No notifications.</div>}
            <button className="popover-foot" onClick={() => { go('notifications'); setBell(false) }}>View all notifications</button>
          </div>
        )}
      </div>
      <div className="pop-wrap" onClick={(e) => e.stopPropagation()}>
        <button className="user-chip" onClick={() => { setMenu(!menu); setBell(false) }}>
          <Avatar name={me.name} size={30} tone="#1C2B4A" />
          <span className="user-chip-name">{me.name}</span>
          <ChevronDown size={14} />
        </button>
        {menu && (
          <div className="popover popover-sm">
            <div className="pad">
              <b>{me.name}</b>
              <div className="muted small">{me.email}</div>
              <div className="muted small">{ROLES[me.role].label} · {me.office}</div>
            </div>
            <button className="menu-row" onClick={() => { go('settings'); setMenu(false) }}><User size={15} /> My profile & settings</button>
            <button className="menu-row" onClick={() => { actions.resetDemo(); setMenu(false) }}><RotateCcw size={15} /> Reset demo data</button>
            <button className="menu-row danger" onClick={actions.logout}><LogOut size={15} /> Sign out</button>
          </div>
        )}
      </div>
    </header>
  )
}

function BottomNav({ route, onMore }) {
  const { me } = useStore()
  const badges = useBadges()
  return (
    <nav className="bottom-nav">
      {BOTTOM[me.role].map(([k, label, Icon]) => (
        <button key={k} className={route === k ? 'active' : ''} onClick={() => go(k)}>
          <span className="bn-icon"><Icon size={19} />{badges[k] > 0 && <i>{badges[k]}</i>}</span>
          <span>{label}</span>
        </button>
      ))}
      <button onClick={onMore}><span className="bn-icon"><MoreHorizontal size={19} /></span><span>More</span></button>
    </nav>
  )
}

export default function Layout({ route, children }) {
  const [side, setSide] = useState(false)
  const [search, setSearch] = useState(false)
  useEffect(() => {
    const h = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setSearch(true) }
    }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [])
  useEffect(() => { document.querySelector('.content')?.scrollTo?.(0, 0) }, [route])
  return (
    <div className="shell">
      <Sidebar route={route} open={side} onClose={() => setSide(false)} />
      <div className="main-col">
        <Header route={route} onMenu={() => setSide(true)} onSearch={() => setSearch(true)} />
        <main className="content">{children}</main>
      </div>
      <BottomNav route={route} onMore={() => setSide(true)} />
      <SearchPalette open={search} onClose={() => setSearch(false)} />
    </div>
  )
}
