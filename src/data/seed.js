import { STAGES, SOURCES, PROPERTY_TYPES, DEFAULT_SETTINGS, ACTIVITY_TYPES, COMPANY } from './constants'
import { addDays, toISODate, AED_TO_INR, pad } from '../lib/utils'

// Deterministic pseudo-random so every fresh demo looks the same
function rng(seed) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

const D = COMPANY.domain

export const USERS = [
  { id: 'u1', name: 'Riya Sharma', email: `admin@${D}`, role: 'admin', office: 'Bangalore', designation: 'Director', department: 'Management', phone: '+91 90000 00001', capacity: 0, joined: '2022-04-01', active: true, rating: 4.9 },
  { id: 'u2', name: 'Karan Mehta', email: `manager@${D}`, role: 'manager', office: 'Bangalore', designation: 'Sales Manager', department: 'Sales', phone: '+91 90000 00002', capacity: 10, joined: '2022-08-15', active: true, rating: 4.7, reportsTo: 'u1' },
  { id: 'u3', name: 'Sara Khan', email: `manager.dubai@${D}`, role: 'manager', office: 'Dubai', designation: 'Sales Manager', department: 'Sales', phone: '+971 50 000 0003', capacity: 10, joined: '2023-01-10', active: true, rating: 4.8, reportsTo: 'u1' },
  { id: 'u4', name: 'Arjun Nair', email: `executive@${D}`, role: 'executive', office: 'Bangalore', designation: 'CRM Executive', department: 'Sales', phone: '+91 90000 00004', capacity: 15, joined: '2023-06-01', active: true, rating: 4.5, reportsTo: 'u2' },
  { id: 'u5', name: 'Priya Iyer', email: `priya@${D}`, role: 'executive', office: 'Bangalore', designation: 'CRM Executive', department: 'Sales', phone: '+91 90000 00005', capacity: 15, joined: '2023-09-12', active: true, rating: 4.6, reportsTo: 'u2' },
  { id: 'u6', name: 'Rahul Verma', email: `rahul@${D}`, role: 'executive', office: 'Bangalore', designation: 'CRM Executive', department: 'Sales', phone: '+91 90000 00006', capacity: 15, joined: '2024-02-20', active: true, rating: 4.2, reportsTo: 'u2' },
  { id: 'u7', name: 'Neha Gupta', email: `neha@${D}`, role: 'executive', office: 'Bangalore', designation: 'CRM Executive', department: 'Sales', phone: '+91 90000 00007', capacity: 12, joined: '2024-07-01', active: true, rating: 4.4, reportsTo: 'u2' },
  { id: 'u8', name: 'Omar Siddiqui', email: `omar@${D}`, role: 'executive', office: 'Dubai', designation: 'CRM Executive', department: 'Sales', phone: '+971 50 000 0008', capacity: 12, joined: '2023-11-05', active: true, rating: 4.6, reportsTo: 'u3' },
  { id: 'u9', name: 'Fatima Ali', email: `fatima@${D}`, role: 'executive', office: 'Dubai', designation: 'CRM Executive', department: 'Sales', phone: '+971 50 000 0009', capacity: 12, joined: '2024-03-18', active: true, rating: 4.7, reportsTo: 'u3' },
  { id: 'u10', name: 'Daniel Thomas', email: `daniel@${D}`, role: 'executive', office: 'Dubai', designation: 'CRM Executive', department: 'Sales', phone: '+971 50 000 0010', capacity: 12, joined: '2024-09-02', active: true, rating: 4.3, reportsTo: 'u3' },
]

const PROJECTS = [
  {
    id: 'p1', name: 'Azure Crest Residences', developer: 'Horizon Developers', location: 'Jumeirah Village Circle', zone: 'JVC', propertyType: 'Apartment', unitTypes: 'Studio / 1BR / 2BR', tier: 'Mid-Range', tag: 'Best Seller', priceAED: 650000, rentalYield: 8.1, appreciation: 7.2, minDeposit: '₹10L (AED 45K)', areaRange: '420 – 1,150 sq ft', completion: 'Q2 2027', floors: 24, totalUnits: 312, available: 4, status: 'Off Plan', hue: 205,
    why: 'Well-priced entry into JVC, one of Dubai\'s most rented communities, with a 60/40 payment plan and strong short-let demand.',
    amenities: ['Rooftop Pool', 'Gym & Fitness Centre', 'Kids Play Area', 'Co-working Lounge', 'Covered Parking', '24/7 Security'],
    paymentPlan: [{ pct: 10, label: 'On Booking' }, { pct: 50, label: 'During Construction' }, { pct: 40, label: 'On Handover' }],
  },
  {
    id: 'p2', name: 'Palmview Heights', developer: 'Crescent Realty Group', location: 'Dubai Marina', zone: 'Dubai Marina', propertyType: 'Apartment', unitTypes: '1BR / 2BR / 3BR', tier: 'Luxury', tag: 'Sea View', priceAED: 1450000, rentalYield: 6.9, appreciation: 8.4, minDeposit: '₹30L (AED 130K)', areaRange: '780 – 1,900 sq ft', completion: 'Q4 2026', floors: 42, totalUnits: 410, available: 4, status: 'Available', hue: 190,
    why: 'Marina waterfront living with full sea views, walkable to the tram and JBR beach — a proven rental and resale market.',
    amenities: ['Infinity Pool', 'Private Beach Access', 'Spa & Sauna', 'Concierge Service', 'Valet Parking', 'Smart Home Automation'],
    paymentPlan: [{ pct: 20, label: 'On Booking' }, { pct: 40, label: 'During Construction' }, { pct: 40, label: 'On Handover' }],
  },
  {
    id: 'p3', name: 'Skyline One Tower', developer: 'Meridian Properties', location: 'Business Bay', zone: 'Business Bay', propertyType: 'Apartment', unitTypes: 'Studio / 1BR / 2BR', tier: 'Mid-Range', tag: 'Canal View', priceAED: 890000, rentalYield: 7.6, appreciation: 7.9, minDeposit: '₹15L (AED 65K)', areaRange: '450 – 1,200 sq ft', completion: 'Q3 2027', floors: 35, totalUnits: 280, available: 3, status: 'Off Plan', hue: 225,
    why: 'Canal-facing tower minutes from Downtown with a post-handover payment plan — popular with first-time Dubai investors.',
    amenities: ['Canal Promenade', 'Gym', 'Yoga Deck', 'Business Centre', 'Retail Podium', '24/7 Security'],
    paymentPlan: [{ pct: 10, label: 'On Booking' }, { pct: 40, label: 'During Construction' }, { pct: 50, label: 'Post Handover (2 yrs)' }],
  },
  {
    id: 'p4', name: 'Oasis Garden Villas', developer: 'Greenleaf Estates', location: 'Dubai Hills', zone: 'Dubai Hills', propertyType: 'Villa', unitTypes: '3BR / 4BR / 5BR Villas', tier: 'Ultra-Luxury', tag: 'Golf Course', priceAED: 4200000, rentalYield: 5.4, appreciation: 9.6, minDeposit: '₹1Cr (AED 420K)', areaRange: '2,800 – 5,200 sq ft', completion: 'Q1 2028', floors: 2, totalUnits: 96, available: 3, status: 'Coming Soon', hue: 150,
    why: 'Gated golf-course villas in Dubai Hills — scarce family inventory with the strongest capital appreciation in the portfolio.',
    amenities: ['Private Garden', 'Golf Course Access', 'Clubhouse', 'Community Pool', 'Cycling Track', 'Smart Home Automation'],
    paymentPlan: [{ pct: 20, label: 'On Booking' }, { pct: 50, label: 'During Construction' }, { pct: 30, label: 'On Handover' }],
  },
  {
    id: 'p5', name: 'Harbor Lights', developer: 'Horizon Developers', location: 'Dubai South', zone: 'Dubai South', propertyType: 'Apartment', unitTypes: 'Studio / 1BR', tier: 'Affordable', tag: 'Airport Corridor', priceAED: 520000, rentalYield: 8.6, appreciation: 7.0, minDeposit: '₹8L (AED 35K)', areaRange: '400 – 720 sq ft', completion: 'Q3 2027', floors: 18, totalUnits: 240, available: 3, status: 'Off Plan', hue: 30,
    why: 'Lowest entry ticket in the portfolio, right in the new airport growth corridor with a 1% monthly payment plan.',
    amenities: ['Pool', 'Padel Court', 'Gym', 'Retail Promenade', 'Covered Parking', '24/7 Security'],
    paymentPlan: [{ pct: 10, label: 'On Booking' }, { pct: 60, label: 'During Construction (1%/month)' }, { pct: 30, label: 'On Handover' }],
  },
  {
    id: 'p6', name: 'The Crown Residences', developer: 'Crescent Realty Group', location: 'Downtown Dubai', zone: 'Downtown Dubai', propertyType: 'Apartment', unitTypes: '2BR / 3BR / Penthouse', tier: 'Ultra-Luxury', tag: 'Burj View', priceAED: 3800000, rentalYield: 5.8, appreciation: 8.8, minDeposit: '₹80L (AED 350K)', areaRange: '1,400 – 4,600 sq ft', completion: 'Ready', floors: 55, totalUnits: 180, available: 2, status: 'Available', hue: 270,
    why: 'Ready-to-move trophy residences facing the Burj — immediate rental income and the strongest brand address in the city.',
    amenities: ['Burj View Terraces', 'Private Cinema', 'Spa', 'Infinity Pool', 'Butler Service', 'Valet Parking'],
    paymentPlan: [{ pct: 100, label: 'Ready — 100% on transfer' }],
  },
]

const UNITS_RAW = [
  ['p1', 'Studio-01', 'Studio', '6', 420, 'Pool View', 650000],
  ['p1', '1BR-01', '1 BHK', '9', 720, 'Garden View', 910000],
  ['p1', '1BR-02', '1 BHK', '14', 735, 'City View', 935000],
  ['p1', '2BR-01', '2 BHK', '18', 1150, 'Pool View', 1380000],
  ['p2', '1BR-01', '1 BHK', '21', 780, 'Marina View', 1450000],
  ['p2', '2BR-01', '2 BHK', '28', 1240, 'Sea View', 2350000],
  ['p2', '2BR-02', '2 BHK', '33', 1260, 'Sea View', 2420000],
  ['p2', '3BR-01', '3 BHK', '39', 1900, 'Sea View', 3650000],
  ['p3', 'Studio-01', 'Studio', '11', 450, 'Canal View', 890000],
  ['p3', '1BR-01', '1 BHK', '17', 760, 'Canal View', 1240000],
  ['p3', '2BR-01', '2 BHK', '26', 1200, 'Burj View', 1980000],
  ['p4', 'V-301', '3 BHK Villa', 'G+1', 2800, 'Park View', 4200000],
  ['p4', 'V-402', '4 BHK Villa', 'G+1', 3900, 'Golf View', 5900000],
  ['p4', 'V-501', '5 BHK Villa', 'G+1', 5200, 'Golf View', 7800000],
  ['p5', 'Studio-01', 'Studio', '4', 400, 'Pool View', 520000],
  ['p5', 'Studio-02', 'Studio', '8', 410, 'Airport View', 535000],
  ['p5', '1BR-01', '1 BHK', '12', 720, 'Pool View', 760000],
  ['p6', '2BR-01', '2 BHK', '38', 1400, 'Burj View', 3800000],
  ['p6', 'PH-01', 'Penthouse', '55', 4600, 'Burj View', 14500000],
]

const FIRST = ['Aditya', 'Meera', 'Vikram', 'Ananya', 'Rohan', 'Kavya', 'Siddharth', 'Isha', 'Nikhil', 'Pooja', 'Varun', 'Sneha', 'Harsh', 'Divya', 'Manish', 'Tanvi', 'Ajay', 'Ritika', 'Suresh', 'Lakshmi', 'Imran', 'Zara', 'Kabir', 'Nisha', 'Gaurav', 'Aisha', 'Pranav', 'Shreya', 'Vivek', 'Anjali', 'Yusuf', 'Leena', 'Deepak', 'Bhavna', 'Farhan', 'Rekha', 'Tarun', 'Swati', 'Mohit', 'Hina', 'Sameer', 'Payal', 'Akash', 'Jaya', 'Raj', 'Simran']
const LAST = ['Reddy', 'Patel', 'Joshi', 'Rao', 'Menon', 'Desai', 'Kulkarni', 'Shetty', 'Pillai', 'Bhat', 'Chopra', 'Malhotra', 'Saxena', 'Hegde', 'Naidu', 'Kumar', 'Sinha', 'Bose', 'Das', 'Khanna']
const NOTES = [
  'Discussed budget and preferred locations. Client keen on rental yield.',
  'Shared brochure and payment plan over WhatsApp.',
  'Client asked for a callback after the weekend.',
  'Explained Dubai Golden Visa eligibility for investments above AED 2M.',
  'Sent comparison of 3 shortlisted projects.',
  'Client wants to visit the sample flat with spouse.',
  'Followed up on documents — passport copy received.',
  'Client comparing with a competitor offer, negotiating on payment plan.',
  'Introductory call, explained company process and SOP.',
  'Client confirmed interest, waiting for funds to be arranged.',
]

export function buildSeed() {
  const r = rng(20261007)
  const pick = (arr) => arr[Math.floor(r() * arr.length)]
  const now = new Date()
  const daysAgo = (n, h = 10) => {
    const d = addDays(now, -n)
    d.setHours(h, Math.floor(r() * 59), 0, 0)
    return d.toISOString()
  }

  const projects = PROJECTS.map((p) => ({ ...p, priceINR: Math.round(p.priceAED * AED_TO_INR), images: [], cover: '' }))
  const units = UNITS_RAW.map(([projectId, code, bhk, floor, area, facing, priceAED], i) => ({
    id: `un${i + 1}`, projectId, code, bhk, floor, area, facing, priceAED, priceINR: Math.round(priceAED * AED_TO_INR),
    status: i % 7 === 3 ? 'Held' : i % 9 === 5 ? 'Sold' : 'Available', photos: [],
  }))

  const blrExec = ['u4', 'u5', 'u6', 'u7']
  const dxbExec = ['u8', 'u9', 'u10']
  const leads = []
  const activities = []
  const usedNames = new Set()
  const stagePlan = [0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 4, 4, 4, 5, 5, 5, 6, 6, 6, 7, 7, 7, 8, 8, 8, 9, 9, 10, 10, 10, 10, 10, 10, 2, 4, 1, 0, 0, 3]

  stagePlan.forEach((stage, i) => {
    let name
    do { name = `${pick(FIRST)} ${pick(LAST)}` } while (usedNames.has(name))
    usedNames.add(name)
    const dubai = stage > 7
    const office = dubai ? 'Dubai' : 'Bangalore'
    let status = 'active'
    if (stage === 10 && i % 2 === 0) status = 'won'
    if (i === 14 || i === 22) status = 'unable'
    if (i === 9) status = 'cancelled'
    let assignedTo = dubai ? pick([...dxbExec, 'u3']) : pick([...blrExec, 'u2'])
    if (i >= 41) assignedTo = null // unassigned leads for AI distribution demo
    const createdDays = stage < 2 ? 1 + Math.floor(r() * 20) : Math.min(175, 10 + stage * 8 + Math.floor(r() * 90))
    const score = Math.min(98, Math.max(18, Math.round(25 + stage * 6 + r() * 25)))
    const project = pick(projects)
    const currency = r() > 0.5 ? 'AED' : 'INR'
    const budgetAED = Math.round((project.priceAED * (0.8 + r() * 0.6)) / 10000) * 10000
    const id = `L${1001 + i}`
    const phone = dubai && r() > 0.5 ? `+971 5${Math.floor(r() * 9)} ${Math.floor(100 + r() * 899)} ${Math.floor(1000 + r() * 8999)}` : `+91 9${Math.floor(r() * 9)}${Math.floor(100 + r() * 899)} ${Math.floor(10000 + r() * 89999)}`
    const followDelta = Math.floor(r() * 9) - 3
    const lead = {
      id, name, phone,
      email: `${name.toLowerCase().replace(/ /g, '.')}@example.com`,
      source: pick(SOURCES),
      propertyType: project.propertyType === 'Villa' ? 'Villa' : pick(PROPERTY_TYPES.slice(0, 2)),
      budget: currency === 'AED' ? budgetAED : Math.round(budgetAED * AED_TO_INR),
      currency,
      location: `${project.zone}, Dubai`,
      interestedProject: project.id,
      office, assignedTo, stage, status, score,
      createdAt: daysAgo(createdDays, 9 + Math.floor(r() * 8)),
      followUp: status === 'active' ? toISODate(addDays(now, followDelta)) : null,
      handedOver: dubai,
      closedAt: status === 'won' ? daysAgo(Math.floor(r() * 25) + 1) : null,
      dealValueAED: status === 'won' ? budgetAED : null,
      reason: status === 'unable' ? 'Client postponed purchase due to funding delay.' : status === 'cancelled' ? 'Duplicate enquiry — client already working with another agent.' : '',
      tags: [],
    }
    leads.push(lead)
    const nActs = Math.min(6, 1 + Math.floor(stage / 2) + Math.floor(r() * 2))
    for (let k = 0; k < nActs; k++) {
      const by = assignedTo || (dubai ? 'u3' : 'u2')
      activities.push({
        id: `a${i}_${k}`, leadId: id, type: k === 0 ? 'Call' : pick(ACTIVITY_TYPES), by,
        note: k === 0 ? NOTES[8] : pick(NOTES),
        at: daysAgo(Math.max(0, createdDays - Math.floor(((k + 1) * createdDays) / (nActs + 1))), 10 + k),
      })
    }
  })

  ;[0, 6, 13, 17, 22].forEach((i) => (leads[i].assignedTo = 'u4'))
  leads[12].assignedTo = 'u6'
  leads[5].assignedTo = 'u6'
  leads[37].assignedTo = 'u9'
  leads[35].assignedTo = 'u8'

  const conversionsBy = {}
  leads.filter((l) => l.status === 'won').forEach((l) => (conversionsBy[l.assignedTo] = (conversionsBy[l.assignedTo] || 0) + 1))

  const visits = [
    { id: 'v1', leadId: leads[19].id, projectId: 'p1', date: toISODate(addDays(now, 1)), time: '11:00', place: 'Azure Crest sales gallery, JVC', assignedTo: 'u5', createdBy: 'u2', status: 'scheduled', outcome: '' },
    { id: 'v2', leadId: leads[22].id, projectId: 'p3', date: toISODate(addDays(now, 2)), time: '15:30', place: 'Virtual tour — Zoom', assignedTo: 'u4', createdBy: 'u4', status: 'scheduled', outcome: '' },
    { id: 'v3', leadId: leads[28].id, projectId: 'p2', date: toISODate(addDays(now, 3)), time: '10:00', place: 'Palmview Heights show apartment', assignedTo: 'u8', createdBy: 'u3', status: 'scheduled', outcome: '' },
    { id: 'v4', leadId: leads[31].id, projectId: 'p6', date: toISODate(addDays(now, 5)), time: '17:00', place: 'The Crown Residences lobby', assignedTo: 'u9', createdBy: 'u9', status: 'scheduled', outcome: '' },
    { id: 'v5', leadId: leads[25].id, projectId: 'p4', date: toISODate(addDays(now, -3)), time: '12:00', place: 'Oasis Garden Villas site office', assignedTo: 'u6', createdBy: 'u2', status: 'completed', outcome: 'Client liked 4BR villa, requested payment plan.' },
    { id: 'v6', leadId: leads[33].id, projectId: 'p2', date: toISODate(addDays(now, -6)), time: '16:00', place: 'Palmview Heights show apartment', assignedTo: 'u10', createdBy: 'u3', status: 'completed', outcome: 'Finalised 2BR sea view unit.' },
    { id: 'v7', leadId: leads[20].id, projectId: 'p5', date: toISODate(addDays(now, -2)), time: '14:00', place: 'Harbor Lights sales centre', assignedTo: 'u7', createdBy: 'u7', status: 'cancelled', outcome: 'Client rescheduled.' },
  ]

  const leaves = [
    { id: 'lv1', userId: 'u5', type: 'Casual Leave', from: toISODate(addDays(now, 6)), to: toISODate(addDays(now, 7)), days: 2, reason: 'Family function in hometown.', status: 'pending', at: daysAgo(1) },
    { id: 'lv2', userId: 'u9', type: 'Sick Leave', from: toISODate(addDays(now, -4)), to: toISODate(addDays(now, -3)), days: 2, reason: 'Fever, doctor advised rest.', status: 'approved', decidedBy: 'u3', at: daysAgo(5) },
    { id: 'lv3', userId: 'u4', type: 'Annual Leave', from: toISODate(addDays(now, 14)), to: toISODate(addDays(now, 18)), days: 5, reason: 'Pre-planned vacation.', status: 'pending', at: daysAgo(2) },
    { id: 'lv4', userId: 'u2', type: 'Casual Leave', from: toISODate(addDays(now, 10)), to: toISODate(addDays(now, 10)), days: 1, reason: 'Personal errand.', status: 'pending', at: daysAgo(0) },
    { id: 'lv5', userId: 'u10', type: 'Emergency Leave', from: toISODate(addDays(now, -12)), to: toISODate(addDays(now, -12)), days: 1, reason: 'Family emergency.', status: 'rejected', decidedBy: 'u3', at: daysAgo(13) },
  ]

  const flags = [
    { id: 'f1', raisedBy: 'u6', about: null, urgency: 'High', text: 'Client Vikram keeps asking for discounts beyond policy and is getting aggressive on calls.', status: 'open', at: daysAgo(1), notes: [] },
    { id: 'f2', raisedBy: 'u2', about: 'u7', urgency: 'Medium', text: 'Neha has 4 follow-ups overdue this week — may need support or redistribution.', status: 'acknowledged', at: daysAgo(3), notes: [{ by: 'u1', text: 'Noted, will review in weekly meeting.', at: daysAgo(2) }] },
    { id: 'f3', raisedBy: 'u8', about: null, urgency: 'Low', text: 'Need updated payment plan PDF for Palmview Heights.', status: 'resolved', at: daysAgo(9), notes: [{ by: 'u3', text: 'Shared the latest brochure.', at: daysAgo(8) }] },
  ]

  const approvals = [
    { id: 'ap1', leadId: leads[37].id, submittedBy: 'u9', status: 'pending_manager', at: daysAgo(1), note: 'All documents received, SPA ready for signing.', history: [{ by: 'u9', action: 'Submitted', at: daysAgo(1) }] },
    { id: 'ap2', leadId: leads[35].id, submittedBy: 'u8', status: 'pending_admin', at: daysAgo(3), note: 'Deposit transferred, need final sign-off.', history: [{ by: 'u8', action: 'Submitted', at: daysAgo(3) }, { by: 'u3', action: 'Approved by Sales Manager', at: daysAgo(2) }] },
  ]

  const escalations = [
    { id: 'e1', leadId: leads[12].id, requestedBy: 'u6', reason: 'Client prefers a Hindi-speaking female agent.', suggestedTo: 'u7', status: 'pending', at: daysAgo(1) },
    { id: 'e2', leadId: leads[5].id, requestedBy: 'u2', reason: 'Agent overloaded this week, moving to balance workload.', suggestedTo: 'u5', status: 'pending', at: daysAgo(0) },
  ]

  const monthName = addDays(now, -now.getDate()).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
  const payroll = USERS.map((u, i) => {
    const base = u.role === 'admin' ? 250000 : u.role === 'manager' ? 140000 : 65000 + i * 2500
    const commission = (conversionsBy[u.id] || 0) * 45000
    const incentive = u.role === 'executive' ? Math.round(r() * 8) * 1000 : 0
    const deductions = Math.round(base * 0.12)
    return { id: `pr${i + 1}`, userId: u.id, month: monthName, base, commission, incentive, deductions, net: base + commission + incentive - deductions, status: i === 0 ? 'approved' : 'pending', submittedBy: 'HR', at: daysAgo(2) }
  })

  const ws = (() => { const x = new Date(now); const d = (x.getDay() + 6) % 7; return addDays(x, -d) })()
  const dayISO = (n) => toISODate(addDays(ws, n))
  const events = [
    { id: 'ev1', userId: 'u2', title: 'Weekly sales review', type: 'Review', category: 'team', date: dayISO(0), start: '10:00', end: '11:00', busy: true },
    { id: 'ev2', userId: 'u4', title: 'Client call — Meera', type: 'Call', category: 'client', date: dayISO(1), start: '12:00', end: '12:30', busy: true },
    { id: 'ev3', userId: 'u1', title: 'Leadership sync', type: 'Meeting', category: 'company', date: dayISO(2), start: '09:00', end: '10:00', busy: true },
    { id: 'ev4', userId: 'u3', title: 'Developer meeting — Horizon', type: 'Meeting', category: 'company', date: dayISO(2), start: '14:00', end: '15:30', busy: true },
    { id: 'ev5', userId: 'u8', title: 'Site visit — Palmview', type: 'Meeting', category: 'client', date: dayISO(3), start: '10:00', end: '12:00', busy: true },
    { id: 'ev6', userId: 'u5', title: 'Lunch', type: 'Personal', category: 'personal', date: dayISO(3), start: '13:00', end: '14:00', busy: true },
    { id: 'ev7', userId: 'u9', title: 'Documentation follow-ups', type: 'Blocked', category: 'personal', date: dayISO(4), start: '15:00', end: '17:00', busy: true },
    { id: 'ev8', userId: 'u6', title: 'Training — Dubai regulations', type: 'Review', category: 'team', date: dayISO(4), start: '11:00', end: '12:00', busy: true },
  ]

  const conversations = [
    { id: 'c_u1_u2', type: 'direct', members: ['u1', 'u2'] },
    { id: 'c_u2_u4', type: 'direct', members: ['u2', 'u4'] },
    { id: 'c_u1_u3', type: 'direct', members: ['u1', 'u3'] },
    { id: 'g1', type: 'group', name: 'Bangalore Sales Team', members: ['u2', 'u4', 'u5', 'u6', 'u7', 'u1'], createdBy: 'u2' },
    { id: 'g2', type: 'group', name: 'Dubai Closing Desk', members: ['u3', 'u8', 'u9', 'u10', 'u1'], createdBy: 'u3' },
  ]
  const messages = [
    { id: 'm1', convId: 'c_u1_u2', from: 'u1', text: 'Karan, can you share this week\'s pipeline numbers before Friday?', at: daysAgo(1, 9) },
    { id: 'm2', convId: 'c_u1_u2', from: 'u2', text: 'Sure, will send by Thursday evening.', at: daysAgo(1, 10) },
    { id: 'm3', convId: 'c_u2_u4', from: 'u2', text: 'Arjun, please follow up with the Housing.com leads today.', at: daysAgo(0, 9) },
    { id: 'm4', convId: 'c_u2_u4', from: 'u4', text: 'On it 👍 calling them after 11.', at: daysAgo(0, 10) },
    { id: 'm5', convId: 'g1', from: 'u2', text: 'Team — great job last week! 3 handovers to Dubai 🎉', at: daysAgo(2, 18) },
    { id: 'm6', convId: 'g1', from: 'u5', text: 'Thanks! Two more are close to finalization.', at: daysAgo(2, 19) },
    { id: 'm7', convId: 'g2', from: 'u3', text: 'Please upload SPA drafts to the lead before submitting for approval.', at: daysAgo(1, 11) },
    { id: 'm8', convId: 'c_u1_u3', from: 'u3', text: 'Two deals pending your final approval.', at: daysAgo(0, 8) },
  ]

  const notifications = []
  const notify = (userId, title, body, priority = 'Medium', link = '', n = 0) =>
    notifications.push({ id: `n${notifications.length + 1}`, userId, title, body, priority, at: daysAgo(n, 9 + notifications.length % 8), read: n > 1, link })
  notify('u1', 'Deal awaiting final approval', `${leads[35].name} — approved by Sales Manager`, 'High', '#approvals', 0)
  notify('u1', 'New escalation request', `${leads[5].name} — reassignment requested`, 'Medium', '#escalations', 0)
  notify('u1', 'Payroll submitted by HR', `${monthName} payroll is ready for sign-off`, 'High', '#payroll', 1)
  notify('u1', 'Sara Khan sent you a message', 'Two deals pending your final approval.', 'Medium', '#messages', 0)
  notify('u2', 'Leave request', 'Priya Iyer applied for Casual Leave', 'Medium', '#leave', 0)
  notify('u2', 'Leave request', 'Arjun Nair applied for Annual Leave', 'Medium', '#leave', 1)
  notify('u2', 'High urgency flag raised', 'Rahul Verma raised a flag', 'High', '#flags', 1)
  notify('u2', 'Riya Sharma sent you a message', 'Can you share this week\'s pipeline numbers?', 'Medium', '#messages', 1)
  notify('u3', 'Deal submitted for approval', `${leads[37].name} — by Fatima Ali`, 'High', '#approvals', 0)
  notify('u3', 'Lead handed over from Bangalore', `${leads[27].name} is ready for Dubai paperwork`, 'Medium', `#lead/${leads[27].id}`, 2)
  notify('u4', 'Follow-up due today', 'You have follow-ups scheduled today', 'Medium', '#leads', 0)
  notify('u4', 'Karan Mehta sent you a message', 'Please follow up with the Housing.com leads today.', 'Medium', '#messages', 0)
  ;['u5', 'u6', 'u7', 'u8', 'u9', 'u10'].forEach((u) => notify(u, 'Welcome to Demo Company CRM', 'Your leads, calendar and team chat are all in one place.', 'Low', '#leads', 3))

  const audit = []
  const log = (by, action, detail, category, n) => audit.push({ id: `au${audit.length + 1}`, by, action, detail, category, at: daysAgo(n, 9 + (audit.length % 9)) })
  log('u1', 'Settings Updated', 'Round-robin auto-assignment enabled', 'settings', 20)
  log('u1', 'Property Added', 'Added project "The Crown Residences"', 'inventory', 18)
  log('u2', 'Lead Created', `Created lead ${leads[3].name}`, 'lead', 12)
  log('u2', 'AI Assignment', 'Distributed 6 leads across 4 agents (Bangalore)', 'assignment', 10)
  log('u3', 'Lead Approved', `Approved ${leads[35].name} — forwarded to Super Admin`, 'approval', 2)
  log('u3', 'Leave Approved', 'Approved Sick Leave for Fatima Ali', 'leave', 5)
  log('u3', 'Leave Rejected', 'Rejected Emergency Leave for Daniel Thomas', 'leave', 13)
  log('u6', 'Lead Status Changed', `${leads[22].name} marked Unable to Close`, 'lead', 4)
  log('u7', 'Lead Cancelled', `${leads[9].name} cancelled — duplicate enquiry`, 'lead', 6)
  log('u5', 'Lead Handover', `${leads[27].name} transferred Bangalore → Dubai`, 'lead', 2)
  log('u1', 'Payroll Approved', `Approved payroll for Riya Sharma (${monthName})`, 'payroll', 1)

  return {
    version: 3,
    seededAt: now.toISOString(),
    users: USERS.map((u) => ({ ...u })),
    projects, units, leads, activities, visits, leaves, flags, approvals, escalations, payroll, events,
    conversations, messages, notifications, audit,
    settings: { ...DEFAULT_SETTINGS },
    nextLeadNo: 1001 + stagePlan.length,
  }
}

export const pad2 = pad
export { STAGES }
