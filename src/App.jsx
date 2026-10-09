import { useEffect, useState } from 'react'
import { useStore } from './store'
import Layout, { NAV, HOME } from './components/Layout'
import { Toasts } from './components/ui'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Leads from './pages/Leads'
import LeadDetail from './pages/LeadDetail'
import Performance from './pages/Performance'
import Approvals from './pages/Approvals'
import Team from './pages/Team'
import Pipeline from './pages/Pipeline'
import Sources from './pages/Sources'
import Workload from './pages/Workload'
import Escalations from './pages/Escalations'
import SiteVisits from './pages/SiteVisits'
import Inventory from './pages/Inventory'
import Org from './pages/Org'
import Leave from './pages/Leave'
import Flags from './pages/Flags'
import Audit from './pages/Audit'
import Payroll from './pages/Payroll'
import Reports from './pages/Reports'
import Calendar from './pages/Calendar'
import Messages from './pages/Messages'
import Notifications from './pages/Notifications'
import SettingsPage from './pages/Settings'

const COMPONENTS = {
  'admin-dashboard': Dashboard, leads: Leads, performance: Performance, approvals: Approvals, team: Team, pipeline: Pipeline,
  sources: Sources, workload: Workload, escalations: Escalations, 'site-visits': SiteVisits, inventory: Inventory, org: Org,
  leave: Leave, flags: Flags, audit: Audit, payroll: Payroll, reports: Reports, calendar: Calendar, messages: Messages,
  notifications: Notifications, settings: SettingsPage,
}

const parse = () => {
  const h = window.location.hash.replace(/^#\/?/, '')
  const [route, param] = h.split('/')
  return { route, param }
}

export default function App() {
  const { me } = useStore()
  const [{ route, param }, setLoc] = useState(parse)
  useEffect(() => {
    const h = () => setLoc(parse())
    window.addEventListener('hashchange', h)
    return () => window.removeEventListener('hashchange', h)
  }, [])

  if (!me) return <><Login /><Toasts /></>

  const allowed = NAV[me.role].flatMap((g) => g.items.map((it) => (Array.isArray(it) ? it[0] : it)))
  let r = route
  if (r === 'lead' && param) {
    return <Layout route="lead"><LeadDetail id={param} /><Toasts /></Layout>
  }
  if (!allowed.includes(r)) r = HOME[me.role]
  const Page = COMPONENTS[r]
  return (
    <Layout route={r}>
      <Page />
      <Toasts />
    </Layout>
  )
}
