import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { buildSeed } from './data/seed'
import { DEMO_PASSWORD, STAGES, HANDOVER_STAGE, DEFAULT_SETTINGS, SOURCES, PROPERTY_TYPES } from './data/constants'
import { uid, todayISO, addDays, toISODate, AED_TO_INR } from './lib/utils'

const KEY = 'democompany_crm_v3'
const SESSION = 'democompany_crm_session'
const THEME = 'democompany_crm_theme'

const load = () => {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const s = JSON.parse(raw)
      if (s && s.version === 3) return s
    }
  } catch (e) { /* ignore */ }
  return buildSeed()
}

const Ctx = createContext(null)
export const useStore = () => useContext(Ctx)

export function StoreProvider({ children }) {
  const [state, setState] = useState(load)
  const [sessionId, setSessionId] = useState(() => {
    try { return localStorage.getItem(SESSION) } catch (e) { return null }
  })
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem(THEME) || 'light' } catch (e) { return 'light' }
  })
  const [toasts, setToasts] = useState([])
  const stateRef = useRef(state)
  stateRef.current = state

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(state)) } catch (e) { /* storage full (large images) */ }
  }, [state])
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try { localStorage.setItem(THEME, theme) } catch (e) { /* ignore */ }
  }, [theme])

  const me = state.users.find((u) => u.id === sessionId) || null

  const toast = useCallback((msg, tone = 'success') => {
    const id = uid('t')
    setToasts((t) => [...t, { id, msg, tone }])
    setToasts((t) => t.slice(-2))
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000)
  }, [])

  // mutate: clone state, run fn(draft), commit
  const mutate = useCallback((fn) => {
    setState((prev) => {
      const draft = structuredClone(prev)
      fn(draft)
      return draft
    })
  }, [])

  const actions = useMemo(() => {
    const nowISO = () => new Date().toISOString()
    const userName = (d, id) => d.users.find((u) => u.id === id)?.name || 'Someone'
    const audit = (d, by, action, detail, category) =>
      d.audit.unshift({ id: uid('au'), by, action, detail, category, at: nowISO() })
    const notify = (d, userIds, title, body, priority = 'Medium', link = '') => {
      ;[...new Set(userIds.filter(Boolean))].forEach((userId) =>
        d.notifications.unshift({ id: uid('n'), userId, title, body, priority, link, at: nowISO(), read: false }))
    }
    const managersOf = (d, office) => d.users.filter((u) => u.role === 'manager' && u.office === office && u.active).map((u) => u.id)
    const admins = (d) => d.users.filter((u) => u.role === 'admin' && u.active).map((u) => u.id)
    const findLead = (d, id) => d.leads.find((l) => l.id === id)
    const pickAgentRoundRobin = (d, office) => {
      const agents = d.users.filter((u) => u.role === 'executive' && u.office === office && u.active)
      if (!agents.length) return null
      const load = (id) => d.leads.filter((l) => l.assignedTo === id && l.status === 'active').length
      return agents.sort((a, b) => load(a.id) / a.capacity - load(b.id) / b.capacity)[0].id
    }
    const myId = () => stateRef.current && sessionId

    return {
      login(email, password, role) {
        const u = stateRef.current.users.find((x) => x.email.toLowerCase() === email.trim().toLowerCase())
        if (!u) return 'No account found with this work email.'
        if (!u.active) return 'This account has been deactivated. Contact your Super Admin.'
        if (password !== DEMO_PASSWORD) return 'Incorrect password. (Demo password: ' + DEMO_PASSWORD + ')'
        if (u.role !== role) return `This account is registered as ${u.role === 'admin' ? 'Super Admin' : u.role === 'manager' ? 'Sales Manager' : 'CRM Executive'}. Please select that role.`
        localStorage.setItem(SESSION, u.id)
        setSessionId(u.id)
        mutate((d) => audit(d, u.id, 'Signed In', `${u.name} signed in`, 'auth'))
        return null
      },
      logout() {
        localStorage.removeItem(SESSION)
        setSessionId(null)
        window.location.hash = ''
      },
      toggleTheme() { setTheme((t) => (t === 'dark' ? 'light' : 'dark')) },
      resetDemo() {
        const fresh = buildSeed()
        setState(fresh)
        toast('Demo data has been reset')
      },

      // ---------- Leads ----------
      addLead(data) {
        let newId
        mutate((d) => {
          const by = sessionId
          const me = d.users.find((u) => u.id === by)
          const office = data.office || me.office
          let assignedTo = data.assignedTo
          if (!assignedTo) {
            if (me.role === 'executive') assignedTo = me.id
            else if (d.settings.autoAssign && d.settings.roundRobin) assignedTo = pickAgentRoundRobin(d, office)
            else assignedTo = null
          }
          newId = `L${d.nextLeadNo++}`
          d.leads.unshift({
            id: newId, name: data.name, phone: data.phone, email: data.email || '', source: data.source,
            propertyType: data.propertyType, budget: data.budget ? Number(data.budget) : null, currency: data.currency || 'INR',
            location: data.location || '', interestedProject: data.interestedProject || '', office, assignedTo,
            stage: 0, status: 'active', score: Number(data.score) || 40, createdAt: nowISO(),
            followUp: toISODate(addDays(new Date(), 1)), handedOver: false, closedAt: null, dealValueAED: null, reason: '', tags: [],
          })
          d.activities.unshift({ id: uid('a'), leadId: newId, type: 'Note', by, note: `Lead created from ${data.source}.`, at: nowISO() })
          audit(d, by, 'Lead Created', `Created lead ${data.name}`, 'lead')
          if (assignedTo && assignedTo !== by) notify(d, [assignedTo], 'New lead assigned to you', `${data.name} · ${data.source}`, 'Medium', `#lead/${newId}`)
          if (!assignedTo && d.settings.unassignedAlerts) notify(d, managersOf(d, office), 'Unassigned lead', `${data.name} needs an agent`, 'Medium', '#workload')
        })
        toast('Lead created')
        return newId
      },
      updateLead(id, patch) {
        mutate((d) => {
          const l = findLead(d, id)
          Object.assign(l, patch)
          audit(d, sessionId, 'Lead Updated', `Updated details for ${l.name}`, 'lead')
        })
        toast('Lead updated')
      },
      deleteLead(id) {
        mutate((d) => {
          const l = findLead(d, id)
          d.leads = d.leads.filter((x) => x.id !== id)
          d.activities = d.activities.filter((a) => a.leadId !== id)
          d.approvals = d.approvals.filter((a) => a.leadId !== id)
          audit(d, sessionId, 'Lead Deleted', `Deleted lead ${l?.name}`, 'lead')
        })
        toast('Lead deleted')
      },
      logActivity({ leadId, type, note, followUp }) {
        mutate((d) => {
          const l = findLead(d, leadId)
          d.activities.unshift({ id: uid('a'), leadId, type, by: sessionId, note, at: nowISO() })
          if (followUp) l.followUp = followUp
          l.score = Math.min(99, l.score + (type === 'Site-Visit' ? 6 : type === 'Call' ? 3 : 1))
          audit(d, sessionId, 'Activity Logged', `${type} logged for ${l.name}`, 'lead')
        })
        toast('Activity logged')
      },
      advanceStage(leadId) {
        mutate((d) => {
          const l = findLead(d, leadId)
          if (l.stage >= STAGES.length - 1) return
          if (l.stage === HANDOVER_STAGE && l.office === 'Bangalore') return
          l.stage += 1
          d.activities.unshift({ id: uid('a'), leadId, type: 'Note', by: sessionId, note: `Stage moved to ${STAGES[l.stage]}.`, at: nowISO() })
          l.score = Math.min(99, l.score + 4)
          audit(d, sessionId, 'Stage Advanced', `${l.name} → ${STAGES[l.stage]}`, 'lead')
          if (l.stage === HANDOVER_STAGE) notify(d, managersOf(d, l.office), 'Ready for Dubai handover', `${l.name} completed Property Finalization`, 'Medium', `#lead/${l.id}`)
        })
        toast('Stage updated')
      },
      setStage(leadId, stage) {
        mutate((d) => {
          const l = findLead(d, leadId)
          l.stage = stage
          if (stage > HANDOVER_STAGE && l.office === 'Bangalore') { l.office = 'Dubai'; l.handedOver = true }
          audit(d, sessionId, 'Stage Changed', `${l.name} → ${STAGES[stage]}`, 'lead')
        })
      },
      handover(leadId, toAgent) {
        mutate((d) => {
          const l = findLead(d, leadId)
          const target = toAgent || pickAgentRoundRobin(d, 'Dubai') || managersOf(d, 'Dubai')[0]
          l.office = 'Dubai'
          l.handedOver = true
          l.stage = HANDOVER_STAGE + 1
          l.assignedTo = target
          d.activities.unshift({ id: uid('a'), leadId, type: 'Note', by: sessionId, note: `Transferred Bangalore → Dubai team (${userName(d, target)}).`, at: nowISO() })
          audit(d, sessionId, 'Lead Handover', `${l.name} transferred Bangalore → Dubai`, 'lead')
          notify(d, [target, ...managersOf(d, 'Dubai')], 'Lead handed over from Bangalore', `${l.name} is ready for Dubai Paperwork Overview`, 'High', `#lead/${l.id}`)
        })
        toast('Lead transferred to Dubai team')
      },
      markUnable(leadId, reason) {
        mutate((d) => {
          const l = findLead(d, leadId)
          l.status = 'unable'; l.reason = reason; l.followUp = null
          d.activities.unshift({ id: uid('a'), leadId, type: 'Note', by: sessionId, note: `Marked Unable to Close: ${reason}`, at: nowISO() })
          audit(d, sessionId, 'Lead Status Changed', `${l.name} marked Unable to Close`, 'lead')
          notify(d, managersOf(d, l.office), 'Lead marked Unable to Close', `${l.name}: ${reason}`, 'Medium', `#lead/${l.id}`)
        })
        toast('Lead marked Unable to Close', 'info')
      },
      cancelLead(leadId, reason) {
        mutate((d) => {
          const l = findLead(d, leadId)
          l.status = 'cancelled'; l.reason = reason; l.followUp = null
          d.approvals.filter((a) => a.leadId === leadId && a.status.startsWith('pending')).forEach((a) => (a.status = 'withdrawn'))
          d.activities.unshift({ id: uid('a'), leadId, type: 'Note', by: sessionId, note: `Lead cancelled: ${reason}`, at: nowISO() })
          audit(d, sessionId, 'Lead Cancelled', `Cancelled lead ${l.name} — ${reason}`, 'lead')
        })
        toast('Lead cancelled', 'info')
      },
      reopenLead(leadId) {
        mutate((d) => {
          const l = findLead(d, leadId)
          l.status = 'active'; l.reason = ''; l.followUp = todayISO()
          d.activities.unshift({ id: uid('a'), leadId, type: 'Note', by: sessionId, note: 'Lead reopened.', at: nowISO() })
          audit(d, sessionId, 'Lead Reopened', `Reopened ${l.name}`, 'lead')
        })
        toast('Lead reopened')
      },
      reschedule(leadId, date) {
        mutate((d) => {
          const l = findLead(d, leadId)
          l.followUp = date
          audit(d, sessionId, 'Follow-up Rescheduled', `${l.name} follow-up → ${date}`, 'lead')
        })
        toast('Follow-up rescheduled')
      },
      bulkStatus(ids, status) {
        mutate((d) => {
          ids.forEach((id) => {
            const l = findLead(d, id)
            if (!l) return
            l.status = status
            if (status !== 'active') l.followUp = null
            if (status === 'unable' || status === 'cancelled') l.reason = l.reason || 'Bulk status change'
          })
          audit(d, sessionId, 'Bulk Status Change', `${ids.length} leads → ${status}`, 'lead')
        })
        toast(`${ids.length} lead(s) updated`)
      },
      assignLead(leadId, userId) {
        mutate((d) => {
          const l = findLead(d, leadId)
          const from = l.assignedTo
          l.assignedTo = userId
          d.activities.unshift({ id: uid('a'), leadId, type: 'Note', by: sessionId, note: `Assigned to ${userName(d, userId)}.`, at: nowISO() })
          audit(d, sessionId, 'Lead Assigned', `${l.name}: ${from ? userName(d, from) : 'Unassigned'} → ${userName(d, userId)}`, 'assignment')
          notify(d, [userId], 'New lead assigned to you', l.name, 'Medium', `#lead/${l.id}`)
        })
        toast('Lead assigned')
      },
      flagLead(leadId, on) {
        mutate((d) => {
          const l = findLead(d, leadId)
          l.tags = on ? [...new Set([...(l.tags || []), 'flagged'])] : (l.tags || []).filter((t) => t !== 'flagged')
        })
      },

      // ---------- Approvals ----------
      submitApproval(leadId, note) {
        mutate((d) => {
          const l = findLead(d, leadId)
          const me = d.users.find((u) => u.id === sessionId)
          const status = me.role === 'executive' ? 'pending_manager' : 'pending_admin'
          d.approvals.unshift({ id: uid('ap'), leadId, submittedBy: me.id, status, at: nowISO(), note, history: [{ by: me.id, action: 'Submitted', at: nowISO() }] })
          audit(d, me.id, 'Submitted for Approval', `${l.name} submitted`, 'approval')
          notify(d, status === 'pending_manager' ? managersOf(d, l.office) : admins(d), 'Deal submitted for approval', `${l.name} — by ${me.name}`, 'High', '#approvals')
        })
        toast('Submitted for approval')
      },
      decideApproval(id, approve, comment = '') {
        mutate((d) => {
          const a = d.approvals.find((x) => x.id === id)
          const me = d.users.find((u) => u.id === sessionId)
          const l = findLead(d, a.leadId)
          if (!approve) {
            a.status = 'rejected'
            a.history.push({ by: me.id, action: `Rejected${comment ? ': ' + comment : ''}`, at: nowISO() })
            audit(d, me.id, 'Approval Rejected', `${l.name} rejected`, 'approval')
            notify(d, [a.submittedBy], 'Approval rejected', `${l.name}${comment ? ': ' + comment : ''}`, 'High', `#lead/${l.id}`)
            return
          }
          if (a.status === 'pending_manager' && me.role === 'manager') {
            a.status = 'pending_admin'
            a.history.push({ by: me.id, action: 'Approved by Sales Manager', at: nowISO() })
            audit(d, me.id, 'Lead Approved', `Approved ${l.name} — forwarded to Super Admin`, 'approval')
            notify(d, [...admins(d), a.submittedBy], 'Deal awaiting final approval', `${l.name} — approved by Sales Manager`, 'High', '#approvals')
          } else {
            a.status = 'approved'
            a.history.push({ by: me.id, action: 'Final approval by Super Admin', at: nowISO() })
            l.status = 'won'
            l.stage = STAGES.length - 1
            l.closedAt = nowISO()
            l.followUp = null
            l.dealValueAED = l.currency === 'AED' ? l.budget : Math.round((l.budget || 0) / AED_TO_INR)
            d.activities.unshift({ id: uid('a'), leadId: l.id, type: 'Note', by: me.id, note: 'Deal approved and closed 🎉', at: nowISO() })
            audit(d, me.id, 'Deal Closed', `${l.name} approved & closed`, 'approval')
            notify(d, [a.submittedBy, l.assignedTo, ...managersOf(d, l.office)], 'Deal closed 🎉', `${l.name} received final approval`, 'High', `#lead/${l.id}`)
          }
        })
        toast(approve ? 'Approved' : 'Rejected', approve ? 'success' : 'info')
      },

      // ---------- Escalations ----------
      requestEscalation(leadId, reason, suggestedTo) {
        mutate((d) => {
          const l = findLead(d, leadId)
          d.escalations.unshift({ id: uid('e'), leadId, requestedBy: sessionId, reason, suggestedTo: suggestedTo || null, status: 'pending', at: nowISO() })
          audit(d, sessionId, 'Escalation Requested', `Reassignment requested for ${l.name}`, 'assignment')
          notify(d, admins(d), 'New escalation request', `${l.name} — reassignment requested`, 'Medium', '#escalations')
        })
        toast('Reassignment request sent to Super Admin')
      },
      decideEscalation(id, approve, toAgent) {
        mutate((d) => {
          const e = d.escalations.find((x) => x.id === id)
          const l = findLead(d, e.leadId)
          e.status = approve ? 'approved' : 'rejected'
          e.decidedAt = nowISO()
          if (approve && toAgent) {
            const from = l.assignedTo
            l.assignedTo = toAgent
            e.assignedTo = toAgent
            d.activities.unshift({ id: uid('a'), leadId: l.id, type: 'Note', by: sessionId, note: `Reassigned ${from ? userName(d, from) : ''} → ${userName(d, toAgent)} (escalation).`, at: nowISO() })
            notify(d, [toAgent], 'Lead reassigned to you', l.name, 'Medium', `#lead/${l.id}`)
          }
          audit(d, sessionId, approve ? 'Escalation Approved' : 'Escalation Rejected', `${l.name}`, 'assignment')
          notify(d, [e.requestedBy], approve ? 'Reassignment approved' : 'Reassignment rejected', l.name, 'Medium', `#lead/${l.id}`)
        })
        toast(approve ? 'Lead reassigned' : 'Request rejected', approve ? 'success' : 'info')
      },

      // ---------- AI distribution ----------
      previewDistribution(office, count) {
        const d = stateRef.current
        const agents = d.users.filter((u) => u.role === 'executive' && u.office === office && u.active)
        const unassigned = d.leads.filter((l) => !l.assignedTo && l.office === office && l.status === 'active')
        const total = Math.max(0, Number(count) || 0) + unassigned.length
        const stats = agents.map((a) => {
          const load = d.leads.filter((l) => l.assignedTo === a.id && l.status === 'active').length
          const won = d.leads.filter((l) => l.assignedTo === a.id && l.status === 'won').length
          const all = d.leads.filter((l) => l.assignedTo === a.id).length
          return { id: a.id, name: a.name, load, capacity: a.capacity, free: Math.max(0, a.capacity - load), conv: all ? won / all : 0, give: 0 }
        })
        for (let i = 0; i < total; i++) {
          const cand = stats.filter((s) => s.load + s.give < s.capacity)
          const pool = cand.length ? cand : stats
          if (!pool.length) break
          pool.sort((a, b) => (a.load + a.give) / a.capacity - (b.load + b.give) / b.capacity || b.conv - a.conv)
          pool[0].give++
        }
        return { agents: stats, unassigned: unassigned.length, newLeads: Math.max(0, Number(count) || 0), total }
      },
      applyDistribution(office, plan) {
        const FN = ['Arnav', 'Diya', 'Kunal', 'Mira', 'Rehan', 'Tara', 'Veer', 'Anika', 'Dev', 'Sana', 'Yash', 'Ira']
        const LN = ['Sethi', 'Kapoor', 'Mathur', 'Ghosh', 'Iyer', 'Rathi', 'Bansal', 'Chawla', 'Arora', 'Jain']
        mutate((d) => {
          const queue = []
          d.leads.filter((l) => !l.assignedTo && l.office === office && l.status === 'active').forEach((l) => queue.push(l))
          for (let i = 0; i < plan.newLeads; i++) {
            const name = `${FN[Math.floor(Math.random() * FN.length)]} ${LN[Math.floor(Math.random() * LN.length)]}`
            const id = `L${d.nextLeadNo++}`
            const lead = {
              id, name, phone: office === 'Dubai' ? `+971 5${Math.floor(Math.random() * 9)} ${Math.floor(100 + Math.random() * 899)} ${Math.floor(1000 + Math.random() * 8999)}` : `+91 9${Math.floor(Math.random() * 9)}${Math.floor(100 + Math.random() * 899)} ${Math.floor(10000 + Math.random() * 89999)}`,
              email: `${name.toLowerCase().replace(/ /g, '.')}@example.com`, source: SOURCES[Math.floor(Math.random() * SOURCES.length)],
              propertyType: PROPERTY_TYPES[Math.floor(Math.random() * 2)], budget: null, currency: 'INR', location: '', interestedProject: '',
              office, assignedTo: null, stage: office === 'Dubai' ? HANDOVER_STAGE + 1 : 0, status: 'active', score: 30 + Math.floor(Math.random() * 30),
              createdAt: nowISO(), followUp: todayISO(), handedOver: office === 'Dubai', closedAt: null, dealValueAED: null, reason: '', tags: [],
            }
            d.leads.unshift(lead)
            queue.push(lead)
          }
          let qi = 0
          plan.agents.forEach((a) => {
            for (let k = 0; k < a.give && qi < queue.length; k++) {
              const l = queue[qi++]
              l.assignedTo = a.id
              d.activities.unshift({ id: uid('a'), leadId: l.id, type: 'Note', by: sessionId, note: `Auto-assigned to ${a.name} by AI distribution.`, at: nowISO() })
            }
            if (a.give) notify(d, [a.id], 'New leads assigned', `${a.give} lead(s) assigned to you by AI distribution`, 'Medium', '#leads')
          })
          const used = plan.agents.filter((a) => a.give).length
          audit(d, sessionId, 'AI Assignment', `Distributed ${qi} leads across ${used} agents (${office})`, 'assignment')
        })
        toast('Leads distributed')
      },

      // ---------- Site visits ----------
      addVisit(v) {
        mutate((d) => {
          d.visits.unshift({ id: uid('v'), status: 'scheduled', outcome: '', createdBy: sessionId, ...v })
          const proj = d.projects.find((p) => p.id === v.projectId)
          if (v.leadId) d.activities.unshift({ id: uid('a'), leadId: v.leadId, type: 'Site-Visit', by: sessionId, note: `Site visit scheduled at ${proj?.name} on ${v.date} ${v.time}.`, at: nowISO() })
          audit(d, sessionId, 'Site Visit Scheduled', `${proj?.name} on ${v.date}`, 'visit')
          if (v.assignedTo !== sessionId) notify(d, [v.assignedTo], 'Site visit assigned', `${proj?.name} · ${v.date} ${v.time}`, 'Medium', '#site-visits')
          d.events.push({ id: uid('ev'), userId: v.assignedTo, title: `Site visit — ${proj?.name}`, type: 'Meeting', category: 'client', date: v.date, start: v.time, end: `${String(Math.min(20, Number(v.time.slice(0, 2)) + 1)).padStart(2, '0')}:${v.time.slice(3)}`, busy: true })
        })
        toast('Site visit scheduled')
      },
      updateVisit(id, status, outcome = '') {
        mutate((d) => {
          const v = d.visits.find((x) => x.id === id)
          v.status = status
          v.outcome = outcome
          audit(d, sessionId, status === 'completed' ? 'Site Visit Completed' : 'Site Visit Cancelled', outcome || '', 'visit')
          if (v.leadId && status === 'completed') d.activities.unshift({ id: uid('a'), leadId: v.leadId, type: 'Site-Visit', by: sessionId, note: `Site visit completed. ${outcome}`, at: nowISO() })
        })
        toast(status === 'completed' ? 'Visit marked completed' : 'Visit cancelled', 'info')
      },

      // ---------- Inventory ----------
      addProject(p, units) {
        mutate((d) => {
          const id = uid('p')
          d.projects.push({ ...p, id, priceINR: Number(p.priceINR) || Math.round(Number(p.priceAED) * AED_TO_INR), hue: Math.floor(Math.random() * 360) })
          ;(units || []).forEach((u) => d.units.push({ ...u, id: uid('un'), projectId: id, photos: [] }))
          audit(d, sessionId, 'Property Added', `Added project "${p.name}"`, 'inventory')
        })
        toast('Property saved')
      },
      deleteProject(id) {
        mutate((d) => {
          const p = d.projects.find((x) => x.id === id)
          d.projects = d.projects.filter((x) => x.id !== id)
          d.units = d.units.filter((u) => u.projectId !== id)
          audit(d, sessionId, 'Property Deleted', `Deleted project "${p?.name}"`, 'inventory')
        })
        toast('Property deleted', 'info')
      },
      addUnit(u) {
        mutate((d) => {
          d.units.push({ ...u, id: uid('un'), photos: [], priceINR: Math.round(Number(u.priceAED) * AED_TO_INR) })
          const p = d.projects.find((x) => x.id === u.projectId)
          audit(d, sessionId, 'Unit Added', `${u.code} added to ${p?.name}`, 'inventory')
        })
        toast('Unit added')
      },
      setUnitStatus(id, status) {
        mutate((d) => {
          const u = d.units.find((x) => x.id === id)
          u.status = status
          const p = d.projects.find((x) => x.id === u.projectId)
          audit(d, sessionId, 'Unit Status Changed', `${p?.name} · ${u.code} → ${status}`, 'inventory')
        })
        toast(`Unit marked ${status}`)
      },
      addUnitPhotos(id, urls) {
        mutate((d) => {
          const u = d.units.find((x) => x.id === id)
          u.photos = [...(u.photos || []), ...urls].slice(0, 8)
        })
        toast('Photos added')
      },

      // ---------- Leave ----------
      applyLeave(l) {
        mutate((d) => {
          const me = d.users.find((u) => u.id === sessionId)
          d.leaves.unshift({ id: uid('lv'), userId: me.id, status: 'pending', at: nowISO(), ...l })
          audit(d, me.id, 'Leave Applied', `${l.type} · ${l.days} day(s)`, 'leave')
          const approvers = me.role === 'executive' ? [me.reportsTo, ...managersOf(d, me.office)] : admins(d)
          if (d.settings.leaveAlerts) notify(d, approvers, 'Leave request', `${me.name} applied for ${l.type}`, 'Medium', '#leave')
        })
        toast('Leave request submitted')
      },
      decideLeave(id, approve) {
        mutate((d) => {
          const l = d.leaves.find((x) => x.id === id)
          l.status = approve ? 'approved' : 'rejected'
          l.decidedBy = sessionId
          audit(d, sessionId, approve ? 'Leave Approved' : 'Leave Rejected', `${l.type} for ${userName(d, l.userId)}`, 'leave')
          notify(d, [l.userId], approve ? 'Leave approved ✅' : 'Leave rejected', `${l.type} · ${l.from} → ${l.to}`, 'Medium', '#leave')
        })
        toast(approve ? 'Leave approved' : 'Leave rejected', approve ? 'success' : 'info')
      },
      cancelLeave(id) {
        mutate((d) => {
          const l = d.leaves.find((x) => x.id === id)
          l.status = 'cancelled'
        })
        toast('Leave request withdrawn', 'info')
      },

      // ---------- Flags ----------
      raiseFlag({ urgency, text, about }) {
        mutate((d) => {
          const me = d.users.find((u) => u.id === sessionId)
          d.flags.unshift({ id: uid('f'), raisedBy: me.id, about: about || null, urgency, text, status: 'open', at: nowISO(), notes: [] })
          audit(d, me.id, 'Flag Raised', `${urgency} urgency flag`, 'compliance')
          notify(d, [...managersOf(d, me.office), ...admins(d)].filter((x) => x !== me.id), urgency === 'High' ? 'High urgency flag raised' : 'New flag raised', `${me.name}: ${text.slice(0, 60)}`, urgency, '#flags')
        })
        toast('Flag submitted')
      },
      updateFlag(id, status, note) {
        mutate((d) => {
          const f = d.flags.find((x) => x.id === id)
          f.status = status
          if (note) f.notes.push({ by: sessionId, text: note, at: nowISO() })
          audit(d, sessionId, `Flag ${status[0].toUpperCase() + status.slice(1)}`, f.text.slice(0, 60), 'compliance')
          notify(d, [f.raisedBy], `Your flag was ${status}`, note || f.text.slice(0, 60), 'Medium', '#flags')
        })
        toast(`Flag ${status}`)
      },

      // ---------- Payroll ----------
      decidePayroll(id, status) {
        mutate((d) => {
          const p = d.payroll.find((x) => x.id === id)
          p.status = status
          p.decidedAt = nowISO()
          audit(d, sessionId, status === 'approved' ? 'Payroll Approved' : 'Payroll Rejected', `${userName(d, p.userId)} (${p.month})`, 'payroll')
        })
        toast(status === 'approved' ? 'Payroll approved' : 'Payroll sent back to HR', status === 'approved' ? 'success' : 'info')
      },
      approveAllPayroll() {
        mutate((d) => {
          const pend = d.payroll.filter((p) => p.status === 'pending')
          pend.forEach((p) => { p.status = 'approved'; p.decidedAt = nowISO() })
          audit(d, sessionId, 'Payroll Approved', `Bulk approved ${pend.length} payroll records`, 'payroll')
        })
        toast('All pending payroll approved')
      },
      runPayroll() {
        mutate((d) => {
          const now = new Date()
          const month = now.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
          if (d.payroll.some((p) => p.month === month)) return
          d.users.filter((u) => u.active).forEach((u, i) => {
            const base = u.role === 'admin' ? 250000 : u.role === 'manager' ? 140000 : 65000 + i * 2500
            const won = d.leads.filter((l) => l.assignedTo === u.id && l.status === 'won').length
            const commission = won * 45000
            const deductions = Math.round(base * 0.12)
            d.payroll.push({ id: uid('pr'), userId: u.id, month, base, commission, incentive: 0, deductions, net: base + commission - deductions, status: 'pending', submittedBy: 'HR', at: nowISO() })
          })
          audit(d, sessionId, 'Payroll Generated', `Payroll draft created for ${month}`, 'payroll')
        })
        toast('Payroll draft generated for this month')
      },

      // ---------- Calendar ----------
      addEvent(ev) {
        mutate((d) => {
          d.events.push({ id: uid('ev'), userId: sessionId, ...ev })
          audit(d, sessionId, 'Event Added', ev.title, 'calendar')
        })
        toast('Event saved')
      },
      deleteEvent(id) {
        mutate((d) => { d.events = d.events.filter((e) => e.id !== id) })
        toast('Event removed', 'info')
      },

      // ---------- Interact ----------
      openDirect(otherId) {
        const ids = [sessionId, otherId].sort()
        const id = `c_${ids[0]}_${ids[1]}`
        if (!stateRef.current.conversations.find((c) => c.id === id)) {
          mutate((d) => { if (!d.conversations.find((c) => c.id === id)) d.conversations.push({ id, type: 'direct', members: ids }) })
        }
        return id
      },
      sendMessage(convId, text) {
        mutate((d) => {
          const c = d.conversations.find((x) => x.id === convId)
          const me = d.users.find((u) => u.id === sessionId)
          d.messages.push({ id: uid('m'), convId, from: me.id, text, at: nowISO() })
          notify(d, c.members.filter((m) => m !== me.id), c.type === 'group' ? `${me.name} in ${c.name}` : `${me.name} sent you a message`, text.slice(0, 80), 'Medium', '#messages')
        })
        // simulated reply so the demo feels alive
        const conv = stateRef.current.conversations.find((x) => x.id === convId)
        const others = conv ? conv.members.filter((m) => m !== sessionId) : []
        if (others.length) {
          const replies = ['Got it 👍', 'Sure, will do.', 'Thanks for the update!', 'Noted — I\'ll get back shortly.', 'Okay, on it.', 'Sounds good 🙌']
          const responder = others[Math.floor(Math.random() * others.length)]
          setTimeout(() => {
            mutate((d) => {
              d.messages.push({ id: uid('m'), convId, from: responder, text: replies[Math.floor(Math.random() * replies.length)], at: new Date().toISOString() })
            })
          }, 1800 + Math.random() * 1500)
        }
      },
      createGroup(name, members) {
        const id = uid('g')
        mutate((d) => {
          d.conversations.push({ id, type: 'group', name, members: [...new Set([sessionId, ...members])], createdBy: sessionId })
          d.messages.push({ id: uid('m'), convId: id, from: sessionId, text: `Created group "${name}"`, at: nowISO(), system: true })
          notify(d, members, 'Added to a group', `You were added to ${name}`, 'Low', '#messages')
        })
        toast('Group created')
        return id
      },

      // ---------- Notifications ----------
      markRead(id) { mutate((d) => { const n = d.notifications.find((x) => x.id === id); if (n) n.read = true }) },
      markAllRead() { mutate((d) => d.notifications.forEach((n) => { if (n.userId === sessionId) n.read = true })); toast('All caught up!') },

      // ---------- Settings & people ----------
      saveSettings(s) {
        mutate((d) => {
          d.settings = { ...d.settings, ...s }
          audit(d, sessionId, 'Settings Updated', 'Lead assignment & notification rules saved', 'settings')
        })
        toast('Settings saved')
      },
      resetSettings() {
        mutate((d) => { d.settings = { ...DEFAULT_SETTINGS } })
        toast('Settings reset to defaults', 'info')
      },
      updateProfile(patch) {
        mutate((d) => { Object.assign(d.users.find((u) => u.id === sessionId), patch) })
        toast('Profile updated')
      },
      addUser(u) {
        mutate((d) => {
          d.users.push({ id: uid('u'), active: true, rating: 4.5, joined: todayISO(), ...u, capacity: Number(u.capacity) || 12 })
          audit(d, sessionId, 'User Added', `${u.name} added as ${u.designation}`, 'people')
        })
        toast('Team member added — they can sign in with the demo password')
      },
      updateUser(id, patch) {
        mutate((d) => {
          const u = d.users.find((x) => x.id === id)
          Object.assign(u, patch)
          audit(d, sessionId, 'User Updated', `${u.name} updated`, 'people')
        })
        toast('Team member updated')
      },
    }
  }, [mutate, sessionId, toast])

  const value = { state, me, theme, actions, toast, toasts }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

// ---------- selectors ----------
export function visibleLeads(state, me) {
  if (!me) return []
  if (me.role === 'admin') return state.leads
  if (me.role === 'manager') return state.leads.filter((l) => l.office === me.office || l.assignedTo === me.id)
  return state.leads.filter((l) => l.assignedTo === me.id)
}

export function teamOf(state, me) {
  if (!me) return []
  if (me.role === 'admin') return state.users
  if (me.role === 'manager') return state.users.filter((u) => u.office === me.office && u.role !== 'admin')
  return state.users.filter((u) => u.office === me.office && u.role !== 'admin')
}

export const userById = (state, id) => state.users.find((u) => u.id === id)
