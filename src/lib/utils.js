export const uid = (p = 'id') => `${p}_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-3)}`

export const pad = (n) => String(n).padStart(2, '0')

export const toISODate = (d) => {
  const x = new Date(d)
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`
}

export const todayISO = () => toISODate(new Date())

export const addDays = (d, n) => {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

export const fmtDate = (d) => {
  if (!d) return '—'
  const x = new Date(d.length === 10 ? d + 'T00:00:00' : d)
  if (isNaN(x)) return '—'
  return x.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export const fmtDateTime = (d) => {
  if (!d) return '—'
  const x = new Date(d)
  return x.toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })
}

export const fmtTime12 = (hhmm) => {
  if (!hhmm) return ''
  const [h, m] = hhmm.split(':').map(Number)
  const ap = h >= 12 ? 'PM' : 'AM'
  const hh = h % 12 || 12
  return `${hh}:${pad(m)} ${ap}`
}

export const timeAgo = (d) => {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  if (s < 86400 * 7) return `${Math.floor(s / 86400)}d ago`
  return fmtDate(d)
}

export const longToday = () =>
  new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

export const initials = (name = '') =>
  name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('')

export const AED_TO_INR = 22.7

export const fmtINR = (v) => {
  if (v == null || v === '' || isNaN(v)) return '—'
  const n = Number(v)
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(1)} L`
  return `₹${n.toLocaleString('en-IN')}`
}

export const fmtAED = (v) => {
  if (v == null || v === '' || isNaN(v)) return '—'
  const n = Number(v)
  if (n >= 1e6) return `AED ${(n / 1e6).toFixed(2)}M`
  if (n >= 1e3) return `AED ${Math.round(n / 1e3)}K`
  return `AED ${n}`
}

export const fmtMoney = (amount, currency) => (currency === 'AED' ? fmtAED(amount) : fmtINR(amount))

export const daysBetween = (a, b) => {
  if (!a || !b) return 0
  const d = (new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) / 86400000
  return d >= 0 ? d + 1 : 0
}

export const downloadCSV = (filename, rows) => {
  if (!rows.length) return
  const cols = Object.keys(rows[0])
  const esc = (v) => {
    const s = v == null ? '' : String(v)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const csv = [cols.join(','), ...rows.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export const tempFromScore = (s) => (s >= 75 ? 'Hot' : s >= 45 ? 'Warm' : 'Cold')

export const startOfWeek = (d) => {
  const x = new Date(d)
  const day = (x.getDay() + 6) % 7 // Monday = 0
  x.setHours(0, 0, 0, 0)
  x.setDate(x.getDate() - day)
  return x
}

export const fileToDataURL = (file) =>
  new Promise((res, rej) => {
    const r = new FileReader()
    r.onload = () => res(r.result)
    r.onerror = rej
    r.readAsDataURL(file)
  })
