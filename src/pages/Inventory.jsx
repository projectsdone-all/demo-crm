import { useState } from 'react'
import { Plus, Trash2, Building2, MapPin, CalendarCheck, Upload, X, ImagePlus } from 'lucide-react'
import { useStore } from '../store'
import { Badge, Empty, Tabs, SectionHead, Modal, Drawer, Field, Confirm, PropertyCover } from '../components/ui'
import { ScheduleVisitModal } from '../components/forms'
import { ZONES, TIERS, LISTING_STATUS, UNIT_STATUS } from '../data/constants'
import { fmtAED, fmtINR, fileToDataURL, AED_TO_INR } from '../lib/utils'

const unitTone = (s) => (s === 'Available' ? 'green' : s === 'Held' ? 'amber' : 'red')

function ProjectBody({ p }) {
  return (
    <>
      <PropertyCover project={p} height={150} />
      {p.images?.length > 0 && <div className="gallery">{p.images.map((src, i) => <img key={i} src={src} alt="" />)}</div>}
      <div className="row-between mt"><div><h3 className="serif">{p.name}</h3><div className="muted small">{p.developer} · {p.location}</div></div><Badge tone="navy">{p.status}</Badge></div>
      <div className="kv-grid">
        <div><span className="eyebrow">Price (AED)</span><b>From {fmtAED(p.priceAED)}</b></div>
        <div><span className="eyebrow">Price (INR)</span><b>{fmtINR(p.priceINR)}</b></div>
        <div><span className="eyebrow">Rental Yield</span><b>{p.rentalYield}%</b></div>
        <div><span className="eyebrow">Appreciation</span><b>{p.appreciation}%</b></div>
        <div><span className="eyebrow">Min Deposit</span><b>{p.minDeposit || '—'}</b></div>
        <div><span className="eyebrow">Area Range</span><b>{p.areaRange || '—'}</b></div>
        <div><span className="eyebrow">Floors</span><b>{p.floors || '—'}</b></div>
        <div><span className="eyebrow">Total Units</span><b>{p.totalUnits || '—'}</b></div>
        <div><span className="eyebrow">Handover</span><b>{p.completion}</b></div>
        <div><span className="eyebrow">Unit Types</span><b>{p.unitTypes}</b></div>
        <div><span className="eyebrow">Tier</span><b>{p.tier}</b></div>
        <div><span className="eyebrow">Tag</span><b>{p.tag || '—'}</b></div>
      </div>
      {p.why && <><div className="eyebrow mt">Why invest</div><p className="small">{p.why}</p></>}
      {p.amenities?.length > 0 && <><div className="eyebrow mt">Amenities</div><div className="chip-row">{p.amenities.map((a) => <span key={a} className="chip static">{a}</span>)}</div></>}
      {p.paymentPlan?.length > 0 && (
        <>
          <div className="eyebrow mt">Payment plan</div>
          <div className="plan">{p.paymentPlan.map((m, i) => <div key={i}><b>{m.pct}%</b><span className="muted tiny">{m.label}</span></div>)}</div>
        </>
      )}
    </>
  )
}

function AddPropertyModal({ open, onClose }) {
  const { actions, toast } = useStore()
  const blank = { name: '', developer: '', location: '', zone: ZONES[0], propertyType: 'Apartment', unitTypes: '', tier: TIERS[1], tag: '', priceINR: '', priceAED: '', rentalYield: '', appreciation: '', minDeposit: '', areaRange: '', completion: '', floors: '', totalUnits: '', available: '', status: 'Available', why: '', amenities: [], paymentPlan: [], cover: '', images: [] }
  const [f, setF] = useState(blank)
  const [am, setAm] = useState('')
  const [ms, setMs] = useState({ pct: '', label: '' })
  const [err, setErr] = useState('')
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const close = () => { setF(blank); setErr(''); onClose() }
  const onCover = async (e) => { const file = e.target.files?.[0]; if (file) setF({ ...f, cover: await fileToDataURL(file) }) }
  const onGallery = async (e) => { const files = [...(e.target.files || [])].slice(0, 6); const urls = await Promise.all(files.map(fileToDataURL)); setF({ ...f, images: [...f.images, ...urls].slice(0, 6) }) }
  const save = () => {
    if (!f.name.trim() || !f.developer.trim()) return setErr('Property name and developer are required.')
    if (!f.priceAED && !f.priceINR) return setErr('Enter a price in AED or INR.')
    const priceAED = Number(f.priceAED) || Math.round(Number(f.priceINR) / AED_TO_INR)
    const priceINR = Number(f.priceINR) || Math.round(priceAED * AED_TO_INR)
    actions.addProject({ ...f, name: f.name.trim(), priceAED, priceINR, rentalYield: Number(f.rentalYield) || 0, appreciation: Number(f.appreciation) || 0, floors: Number(f.floors) || '', totalUnits: Number(f.totalUnits) || '', available: Number(f.available) || 0, completion: f.completion || 'TBA' })
    close()
  }
  return (
    <Modal open={open} onClose={close} title="Add New Property" size="xl" wide
      footer={<><button className="btn btn-ghost" onClick={close}>Cancel</button><button className="btn btn-primary" onClick={save}>Save Property</button></>}>
      <div className="form-section">Basic Information</div>
      <div className="grid-3">
        <Field label="Property Name" required><input value={f.name} onChange={set('name')} placeholder="e.g. Azure Crest Residences" /></Field>
        <Field label="Developer" required><input value={f.developer} onChange={set('developer')} placeholder="e.g. Horizon Developers" /></Field>
        <Field label="Location"><input value={f.location} onChange={set('location')} placeholder="e.g. Jumeirah Village Circle" /></Field>
        <Field label="Zone"><select value={f.zone} onChange={set('zone')}>{ZONES.map((z) => <option key={z}>{z}</option>)}</select></Field>
        <Field label="Property Type"><select value={f.propertyType} onChange={set('propertyType')}><option>Apartment</option><option>Villa</option><option>Townhouse</option><option>Plot</option></select></Field>
        <Field label="Unit Types"><input value={f.unitTypes} onChange={set('unitTypes')} placeholder="e.g. Studio / 1BR / 2BR" /></Field>
        <Field label="Tier"><select value={f.tier} onChange={set('tier')}>{TIERS.map((z) => <option key={z}>{z}</option>)}</select></Field>
        <Field label="Tag Label"><input value={f.tag} onChange={set('tag')} placeholder="e.g. Sea View" /></Field>
      </div>
      <div className="form-section">Pricing & Returns</div>
      <div className="grid-3">
        <Field label="Price (AED)"><input type="number" value={f.priceAED} onChange={set('priceAED')} placeholder="e.g. 850000" /></Field>
        <Field label="Price (INR)" hint={f.priceAED && !f.priceINR ? `≈ ${fmtINR(Number(f.priceAED) * AED_TO_INR)}` : ''}><input type="number" value={f.priceINR} onChange={set('priceINR')} placeholder="auto from AED" /></Field>
        <Field label="Rental Yield (%)"><input type="number" step="0.1" value={f.rentalYield} onChange={set('rentalYield')} /></Field>
        <Field label="Appreciation (%)"><input type="number" step="0.1" value={f.appreciation} onChange={set('appreciation')} /></Field>
        <Field label="Min Deposit"><input value={f.minDeposit} onChange={set('minDeposit')} placeholder="e.g. ₹10L (AED 40K)" /></Field>
        <Field label="Area Range"><input value={f.areaRange} onChange={set('areaRange')} placeholder="e.g. 480 – 750 sq ft" /></Field>
      </div>
      <div className="form-section">Project Details</div>
      <div className="grid-3">
        <Field label="Completion Quarter"><input value={f.completion} onChange={set('completion')} placeholder="e.g. Q2 2027" /></Field>
        <Field label="Floors"><input type="number" value={f.floors} onChange={set('floors')} /></Field>
        <Field label="Total Units"><input type="number" value={f.totalUnits} onChange={set('totalUnits')} /></Field>
        <Field label="Available Inventory"><input type="number" value={f.available} onChange={set('available')} /></Field>
        <Field label="Listing Status"><select value={f.status} onChange={set('status')}>{LISTING_STATUS.map((z) => <option key={z}>{z}</option>)}</select></Field>
      </div>
      <Field label="Why invest"><textarea rows={2} value={f.why} onChange={set('why')} placeholder="One or two lines your agents can share with clients" /></Field>
      <div className="form-section">Amenities</div>
      <div className="row gap-sm">
        <input value={am} onChange={(e) => setAm(e.target.value)} placeholder="Add amenity and press Enter" onKeyDown={(e) => { if (e.key === 'Enter' && am.trim()) { e.preventDefault(); setF({ ...f, amenities: [...f.amenities, am.trim()] }); setAm('') } }} />
        <button className="btn btn-ghost" onClick={() => { if (am.trim()) { setF({ ...f, amenities: [...f.amenities, am.trim()] }); setAm('') } }}>Add</button>
      </div>
      <div className="chip-row mt-sm">{f.amenities.map((a, i) => <span key={i} className="chip static">{a} <button onClick={() => setF({ ...f, amenities: f.amenities.filter((_, j) => j !== i) })}><X size={12} /></button></span>)}</div>
      <div className="form-section">Payment Plan</div>
      <div className="row gap-sm">
        <input type="number" className="w-80" value={ms.pct} onChange={(e) => setMs({ ...ms, pct: e.target.value })} placeholder="%" />
        <input value={ms.label} onChange={(e) => setMs({ ...ms, label: e.target.value })} placeholder="e.g. On Booking" />
        <button className="btn btn-ghost" onClick={() => { if (ms.pct && ms.label) { setF({ ...f, paymentPlan: [...f.paymentPlan, { pct: Number(ms.pct), label: ms.label }] }); setMs({ pct: '', label: '' }) } }}>Add Milestone</button>
      </div>
      {f.paymentPlan.length > 0 && (
        <div className="plan mt-sm">{f.paymentPlan.map((m, i) => <div key={i}><b>{m.pct}%</b><span className="muted tiny">{m.label}</span></div>)}
          <span className={`tiny ${f.paymentPlan.reduce((a, m) => a + m.pct, 0) === 100 ? 'text-green' : 'text-amber'}`}>Total {f.paymentPlan.reduce((a, m) => a + m.pct, 0)}%</span></div>
      )}
      <div className="form-section">Images</div>
      <div className="grid-2">
        <Field label="Hero / Cover Image">
          {f.cover ? <div className="thumb-wrap"><img className="thumb-lg" src={f.cover} alt="" /><button className="icon-btn" onClick={() => setF({ ...f, cover: '' })}><X size={14} /></button></div> : (
            <>
              <label className="upload"><Upload size={16} /> Upload Image<input type="file" accept="image/*" onChange={onCover} hidden /></label>
              <input className="mt-sm" placeholder="Or paste image URL" onBlur={(e) => e.target.value && setF({ ...f, cover: e.target.value })} />
            </>
          )}
        </Field>
        <Field label={`Gallery Images (${f.images.length})`}>
          <label className="upload"><ImagePlus size={16} /> Add Gallery Images<input type="file" accept="image/*" multiple onChange={onGallery} hidden /></label>
          <div className="gallery">{f.images.map((src, i) => <img key={i} src={src} alt="" onClick={() => setF({ ...f, images: f.images.filter((_, j) => j !== i) })} title="Click to remove" />)}</div>
        </Field>
      </div>
      {err && <div className="alert alert-red mt">{err}</div>}
      <p className="muted tiny mt-sm" onClick={() => toast('Images are stored in this browser only (demo mode).', 'info')}>Demo note: uploaded images are kept in this browser only.</p>
    </Modal>
  )
}

function AddUnitModal({ open, onClose, projectId }) {
  const { state, actions } = useStore()
  const [f, setF] = useState({ code: '', bhk: '1 BHK', floor: '', area: '', facing: '', priceAED: '', status: 'Available' })
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const [pid, setPid] = useState('')
  const proj = projectId || pid
  const ok = proj && f.code && f.priceAED
  return (
    <Modal open={open} onClose={onClose} title="Add Unit"
      footer={<><button className="btn btn-ghost" onClick={onClose}>Cancel</button><button className="btn btn-primary" disabled={!ok} onClick={() => { actions.addUnit({ ...f, projectId: proj, area: Number(f.area) || 0, priceAED: Number(f.priceAED) }); onClose(); setF({ code: '', bhk: '1 BHK', floor: '', area: '', facing: '', priceAED: '', status: 'Available' }) }}>Add Unit</button></>}>
      {!projectId && <Field label="Project" required><select value={pid} onChange={(e) => setPid(e.target.value)}><option value="">Select project</option>{state.projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>}
      <div className="grid-2">
        <Field label="Unit code" required><input value={f.code} onChange={set('code')} placeholder="e.g. 2BR-03" /></Field>
        <Field label="BHK"><select value={f.bhk} onChange={set('bhk')}>{['Studio', '1 BHK', '2 BHK', '3 BHK', '4 BHK Villa', 'Penthouse'].map((x) => <option key={x}>{x}</option>)}</select></Field>
        <Field label="Floor"><input value={f.floor} onChange={set('floor')} placeholder="e.g. 12" /></Field>
        <Field label="Area (sq ft)"><input type="number" value={f.area} onChange={set('area')} /></Field>
        <Field label="Facing"><input value={f.facing} onChange={set('facing')} placeholder="e.g. Sea View" /></Field>
        <Field label="Price (AED)" required hint={f.priceAED ? `≈ ${fmtINR(f.priceAED * AED_TO_INR)}` : ''}><input type="number" value={f.priceAED} onChange={set('priceAED')} /></Field>
      </div>
    </Modal>
  )
}

export default function Inventory() {
  const { state, me, actions } = useStore()
  const [proj, setProj] = useState('')
  const [status, setStatus] = useState('All')
  const [m, setM] = useState(null)
  const [openProj, setOpenProj] = useState(null)
  const [unitId, setUnitId] = useState(null)
  const [del, setDel] = useState(null)
  const canEdit = me.role !== 'executive'
  const isAdmin = me.role === 'admin'
  const units = state.units.filter((u) => (!proj || u.projectId === proj) && (status === 'All' || u.status === status))
  const unit = state.units.find((u) => u.id === unitId)
  const unitProj = unit && state.projects.find((p) => p.id === unit.projectId)
  const p = state.projects.find((x) => x.id === openProj)
  const onUnitPhotos = async (e) => { const files = [...(e.target.files || [])].slice(0, 4); const urls = await Promise.all(files.map(fileToDataURL)); actions.addUnitPhotos(unit.id, urls) }

  return (
    <div className="page">
      <SectionHead title="Projects" subtitle={`${state.projects.length} registered projects · ${state.units.filter((u) => u.status === 'Available').length} units available`}>
        {canEdit && <button className="btn btn-ghost" onClick={() => setM('unit')}><Plus size={15} /> Add Unit</button>}
        {isAdmin && <button className="btn btn-primary" onClick={() => setM('add')}><Plus size={15} /> Add Property</button>}
      </SectionHead>
      {state.projects.length === 0 ? <div className="card"><Empty icon={Building2} title="No properties yet" text="Add your first project to start sharing inventory with the team." /></div> : (
        <div className="proj-grid">
          {state.projects.map((pr) => {
            const pu = state.units.filter((u) => u.projectId === pr.id)
            const av = pu.filter((u) => u.status === 'Available').length
            return (
              <div key={pr.id} className="card proj" onClick={() => setOpenProj(pr.id)}>
                <PropertyCover project={pr} />
                {pr.tag && <span className="proj-tag">{pr.tag}</span>}
                <div className="proj-body">
                  <div className="row-between"><Badge tone="green" dot>Registered</Badge><Badge tone="gray">{pr.status}</Badge></div>
                  <h4>{pr.name}</h4>
                  <div className="muted small">{pr.developer}</div>
                  <div className="muted small"><MapPin size={12} /> {pr.location}</div>
                  <div className="row-between small mt-sm"><span><CalendarCheck size={12} /> {pr.completion}</span><b className={av ? 'text-green' : 'text-red'}>{av}/{pu.length} avail.</b></div>
                  <div className="proj-price"><b>From {fmtAED(pr.priceAED)}</b><span className="muted tiny">≈ {fmtINR(pr.priceINR)}</span></div>
                  {isAdmin && <button className="link text-red small" onClick={(e) => { e.stopPropagation(); setDel(pr.id) }}><Trash2 size={13} /> Delete Property</button>}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="card">
        <div className="card-head wrap"><h3>Units</h3>
          <div className="row gap-sm wrap">
            <select className="w-auto" value={proj} onChange={(e) => setProj(e.target.value)}>
              <option value="">All Projects</option>{state.projects.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
            </select>
            <Tabs value={status} onChange={setStatus} tabs={['All', ...UNIT_STATUS]} />
          </div>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Unit</th><th>Project</th><th>BHK</th><th className="hide-sm">Floor</th><th>Area</th><th className="hide-sm">Facing</th><th>Price</th><th>Status</th><th /></tr></thead>
            <tbody>
              {units.map((u) => (
                <tr key={u.id} className="clickable" onClick={() => setUnitId(u.id)}>
                  <td><b>{u.code}</b></td>
                  <td>{state.projects.find((x) => x.id === u.projectId)?.name}</td>
                  <td>{u.bhk}</td><td className="hide-sm">{u.floor}</td><td>{Number(u.area).toLocaleString()} sqft</td><td className="hide-sm">{u.facing}</td>
                  <td><b>{fmtAED(u.priceAED)}</b><div className="muted tiny">{fmtINR(u.priceINR)}</div></td>
                  <td><Badge tone={unitTone(u.status)}>{u.status}</Badge></td>
                  <td><button className="link">View</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!units.length && <Empty title="No units match" text="Try another project or status filter." />}
        </div>
      </div>

      <Drawer open={!!p} onClose={() => setOpenProj(null)} title={p?.name}
        footer={p && <>{isAdmin && <button className="btn btn-ghost text-red" onClick={() => setDel(p.id)}><Trash2 size={14} /> Delete</button>}{canEdit && <button className="btn btn-ghost" onClick={() => setM('unitp')}><Plus size={14} /> Add Unit</button>}<button className="btn btn-primary" onClick={() => setM('visit')}>Schedule Visit</button></>}>
        {p && (
          <>
            <ProjectBody p={p} />
            <div className="eyebrow mt">Units</div>
            {state.units.filter((u) => u.projectId === p.id).map((u) => (
              <button key={u.id} className="mini-row clickable" onClick={() => { setOpenProj(null); setUnitId(u.id) }}>
                <b className="small grow">{u.code} · {u.bhk}</b><span className="small">{fmtAED(u.priceAED)}</span><Badge tone={unitTone(u.status)}>{u.status}</Badge>
              </button>
            ))}
          </>
        )}
      </Drawer>

      <Drawer open={!!unit} onClose={() => setUnitId(null)} title={unit && unitProj ? `${unitProj.name} · ${unit.code}` : ''}
        footer={unit && <button className="btn btn-primary" onClick={() => setM('visit')}>Schedule Site Visit</button>}>
        {unit && unitProj && (
          <>
            <div className="eyebrow">Photos</div>
            <div className="gallery">
              {(unit.photos || []).map((src, i) => <img key={i} src={src} alt="" />)}
              <label className="upload upload-sq"><ImagePlus size={16} /> {unit.photos?.length ? 'Add' : 'Add Photos'}<input type="file" accept="image/*" multiple hidden onChange={onUnitPhotos} /></label>
            </div>
            <div className="eyebrow mt">Property details</div>
            <div className="kv-grid">
              <div><span className="eyebrow">BHK / Floor</span><b>{unit.bhk} · {unit.floor}</b></div>
              <div><span className="eyebrow">Area</span><b>{Number(unit.area).toLocaleString()} sqft</b></div>
              <div><span className="eyebrow">Facing</span><b>{unit.facing}</b></div>
              <div><span className="eyebrow">Price</span><b>{fmtAED(unit.priceAED)}</b><span className="muted tiny">{fmtINR(unit.priceINR)}</span></div>
              <div><span className="eyebrow">Location</span><b>{unitProj.location}</b></div>
              <div><span className="eyebrow">Possession</span><b>{unitProj.completion}</b></div>
            </div>
            <div className="eyebrow mt">Status</div>
            {canEdit ? (
              <div className="chip-row">{UNIT_STATUS.map((s) => <button key={s} className={`chip ${unit.status === s ? 'active' : ''}`} onClick={() => actions.setUnitStatus(unit.id, s)}>{s}</button>)}</div>
            ) : <Badge tone={unitTone(unit.status)}>{unit.status}</Badge>}
            <hr />
            <div className="eyebrow">Project</div>
            <ProjectBody p={unitProj} />
          </>
        )}
      </Drawer>

      <AddPropertyModal open={m === 'add'} onClose={() => setM(null)} />
      <AddUnitModal open={m === 'unit' || m === 'unitp'} projectId={m === 'unitp' ? p?.id : ''} onClose={() => setM(null)} />
      <ScheduleVisitModal open={m === 'visit'} projectId={unit?.projectId || p?.id} onClose={() => setM(null)} />
      <Confirm open={!!del} onClose={() => setDel(null)} danger title="Delete property?" confirmText="Delete Property" message="This removes the project and all its units from inventory." onConfirm={() => { actions.deleteProject(del); setOpenProj(null) }} />
    </div>
  )
}
