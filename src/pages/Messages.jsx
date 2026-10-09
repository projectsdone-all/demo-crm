import { useEffect, useRef, useState } from 'react'
import { Send, Users, ArrowLeft, Plus, Search } from 'lucide-react'
import { useStore, userById } from '../store'
import { Avatar, Modal, Field } from '../components/ui'
import { ROLES } from '../data/constants'
import { timeAgo, fmtDateTime } from '../lib/utils'

const convFromHash = () => window.location.hash.replace(/^#\/?/, '').split('/')[1] || null

export default function Messages() {
  const { state, me, actions } = useStore()
  const [cid, setCid] = useState(convFromHash)
  const [text, setText] = useState('')
  const [q, setQ] = useState('')
  const [grp, setGrp] = useState(null)
  const endRef = useRef(null)

  useEffect(() => {
    const h = () => setCid(convFromHash())
    window.addEventListener('hashchange', h)
    return () => window.removeEventListener('hashchange', h)
  }, [])
  const open = (id) => { window.location.hash = `messages/${id}` }
  const conv = state.conversations.find((c) => c.id === cid && c.members.includes(me.id))
  const msgs = conv ? state.messages.filter((m) => m.convId === conv.id) : []
  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end' }) }, [msgs.length, cid])
  useEffect(() => {
    if (state.notifications.some((n) => n.userId === me.id && !n.read && n.link === '#messages')) {
      state.notifications.filter((n) => n.userId === me.id && !n.read && n.link === '#messages').forEach((n) => actions.markRead(n.id))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cid])

  const last = (id) => state.messages.filter((m) => m.convId === id).at(-1)
  const groups = state.conversations.filter((c) => c.type === 'group' && c.members.includes(me.id))
  const people = state.users.filter((u) => u.id !== me.id && u.active && u.name.toLowerCase().includes(q.toLowerCase()))
  const directId = (uid) => { const ids = [me.id, uid].sort(); return `c_${ids[0]}_${ids[1]}` }
  const sorted = [...people].sort((a, b) => new Date(last(directId(b.id))?.at || 0) - new Date(last(directId(a.id))?.at || 0))
  const send = (e) => { e.preventDefault(); if (!text.trim() || !conv) return; actions.sendMessage(conv.id, text.trim()); setText('') }
  const other = conv?.type === 'direct' ? userById(state, conv.members.find((m) => m !== me.id)) : null

  return (
    <div className="page page-fill">
      <div className={`chat card ${conv ? 'has-conv' : ''}`}>
        <div className="chat-list">
          <div className="chat-list-head">
            <h3>Interact</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => setGrp({ name: '', members: [] })}><Plus size={14} /> New Group</button>
          </div>
          <div className="search-input"><Search size={14} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search people…" /></div>
          {groups.length > 0 && <div className="nav-label dark">Groups</div>}
          {groups.map((g) => {
            const lm = last(g.id)
            return (
              <button key={g.id} className={`chat-item ${cid === g.id ? 'active' : ''}`} onClick={() => open(g.id)}>
                <span className="avatar group-av"><Users size={15} /></span>
                <div className="grow"><b>{g.name}</b><span className="muted tiny ellipsis">{lm ? `${userById(state, lm.from)?.name.split(' ')[0]}: ${lm.text}` : `${g.members.length} members`}</span></div>
                {lm && <span className="muted tiny">{timeAgo(lm.at)}</span>}
              </button>
            )
          })}
          <div className="nav-label dark">Direct</div>
          {sorted.map((u) => {
            const lm = last(directId(u.id))
            return (
              <button key={u.id} className={`chat-item ${cid === directId(u.id) ? 'active' : ''}`} onClick={() => open(actions.openDirect(u.id))}>
                <Avatar name={u.name} size={34} />
                <div className="grow"><b>{u.name}</b><span className="muted tiny ellipsis">{lm ? lm.text : `${ROLES[u.role].label} · ${u.office}`}</span></div>
                {lm && <span className="muted tiny">{timeAgo(lm.at)}</span>}
              </button>
            )
          })}
        </div>
        <div className="chat-thread">
          {!conv ? (
            <div className="chat-empty"><Users size={28} /><p>Select a conversation or start a new one.</p></div>
          ) : (
            <>
              <div className="chat-head">
                <button className="icon-btn chat-back" onClick={() => { window.location.hash = 'messages' }}><ArrowLeft size={18} /></button>
                {other ? <Avatar name={other.name} size={34} /> : <span className="avatar group-av"><Users size={15} /></span>}
                <div><b>{other ? other.name : conv.name}</b><div className="muted tiny">{other ? `${ROLES[other.role].label} · ${other.office}` : conv.members.map((m) => userById(state, m)?.name.split(' ')[0]).join(', ')}</div></div>
              </div>
              <div className="chat-body">
                {msgs.length === 0 && <p className="muted small center">No messages yet — say hello 👋</p>}
                {msgs.map((m) => m.system ? <div key={m.id} className="sys-msg">{m.text}</div> : (
                  <div key={m.id} className={`bubble-row ${m.from === me.id ? 'me' : ''}`}>
                    {m.from !== me.id && conv.type === 'group' && <Avatar name={userById(state, m.from)?.name} size={26} />}
                    <div className="bubble" title={fmtDateTime(m.at)}>
                      {m.from !== me.id && conv.type === 'group' && <b className="tiny">{userById(state, m.from)?.name}</b>}
                      <span>{m.text}</span>
                      <small>{timeAgo(m.at)}</small>
                    </div>
                  </div>
                ))}
                <div ref={endRef} />
              </div>
              <form className="chat-input" onSubmit={send}>
                <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message…" />
                <button className="btn btn-primary" disabled={!text.trim()}><Send size={15} /></button>
              </form>
            </>
          )}
        </div>
      </div>
      <Modal open={!!grp} onClose={() => setGrp(null)} title="New Group"
        footer={grp && <><button className="btn btn-ghost" onClick={() => setGrp(null)}>Cancel</button><button className="btn btn-primary" disabled={!grp.name.trim() || !grp.members.length} onClick={() => { const id = actions.createGroup(grp.name.trim(), grp.members); setGrp(null); open(id) }}>Create Group</button></>}>
        {grp && (
          <>
            <Field label="Group name" required><input value={grp.name} onChange={(e) => setGrp({ ...grp, name: e.target.value })} placeholder="e.g. Team Alpha, Weekend On-call" autoFocus /></Field>
            <Field label="Add members">
              <div className="member-pick">
                {state.users.filter((u) => u.id !== me.id && u.active).map((u) => (
                  <label key={u.id} className={`pick ${grp.members.includes(u.id) ? 'on' : ''}`}>
                    <input type="checkbox" checked={grp.members.includes(u.id)} onChange={() => setGrp({ ...grp, members: grp.members.includes(u.id) ? grp.members.filter((x) => x !== u.id) : [...grp.members, u.id] })} />
                    <Avatar name={u.name} size={28} /><div><b className="small">{u.name}</b><div className="muted tiny">{ROLES[u.role].label} · {u.office}</div></div>
                  </label>
                ))}
              </div>
            </Field>
            <p className="muted small">{grp.members.length} member{grp.members.length === 1 ? '' : 's'} selected</p>
          </>
        )}
      </Modal>
    </div>
  )
}
