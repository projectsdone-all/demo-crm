import { useState } from 'react'
import { Bell, CheckCheck } from 'lucide-react'
import { useStore } from '../store'
import { Tabs, Badge, Empty, SectionHead } from '../components/ui'
import { timeAgo, fmtDateTime } from '../lib/utils'

const pTone = { High: 'red', Medium: 'amber', Low: 'gray' }

export default function Notifications() {
  const { state, me, actions } = useStore()
  const [tab, setTab] = useState('all')
  const mine = state.notifications.filter((n) => n.userId === me.id)
  const unread = mine.filter((n) => !n.read)
  const list = tab === 'unread' ? unread : mine
  return (
    <div className="page">
      <SectionHead title="All Notifications" subtitle={`${unread.length} unread`}>
        <button className="btn btn-ghost" disabled={!unread.length} onClick={actions.markAllRead}><CheckCheck size={15} /> Mark all read</button>
      </SectionHead>
      <Tabs value={tab} onChange={setTab} tabs={[{ key: 'all', label: 'All', count: mine.length }, { key: 'unread', label: 'Unread', count: unread.length }]} />
      <div className="card">
        {!list.length ? <Empty icon={Bell} title="All caught up!" text="No unread notifications right now." /> : list.map((n) => (
          <button key={n.id} className={`notif-full ${n.read ? '' : 'unread'}`} onClick={() => { actions.markRead(n.id); if (n.link) window.location.hash = n.link }}>
            <span className="notif-dot" />
            <div className="grow">
              <div className="row gap-sm wrap"><b>{n.title}</b><Badge tone={pTone[n.priority] || 'gray'}>{n.priority}</Badge></div>
              <div className="small muted">{n.body}</div>
            </div>
            <span className="muted tiny nowrap" title={fmtDateTime(n.at)}>{timeAgo(n.at)}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
