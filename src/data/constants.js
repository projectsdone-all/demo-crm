export const COMPANY = {
  name: 'Demo Company',
  short: 'DC',
  domain: 'democompany.com',
  tagline: 'Real Estate CRM',
}

export const DEMO_PASSWORD = 'demo1234'

export const ROLES = {
  executive: { key: 'executive', label: 'CRM Executive', desc: 'Manage leads & client follow-ups' },
  manager: { key: 'manager', label: 'Sales Manager', desc: 'Team oversight & lead distribution' },
  admin: { key: 'admin', label: 'Super Admin', desc: 'Full organisation control' },
}

export const STAGES = [
  'Lead Generation',
  'Initial Approach',
  'Qualified Lead',
  'Consultative Approach',
  'Client Onboarding',
  'Property Highlights',
  'Property Recommendation',
  'Property Finalization',
  'Dubai Paperwork Overview',
  'Investment Terms & Structure',
  'Documentation & Deal Finalization',
]
export const HANDOVER_STAGE = 7 // after Property Finalization, lead moves to Dubai team

export const SOURCES = ['Housing.com', 'Social Media', 'Referral', 'Walk-in', 'Website']
export const PROPERTY_TYPES = ['Apartment', 'Villa', 'Plot']
export const OFFICES = ['Bangalore', 'Dubai']
export const ACTIVITY_TYPES = ['Call', 'Email', 'Whatsapp', 'Site-Visit', 'Note']
export const LEAVE_TYPES = ['Casual Leave', 'Sick Leave', 'Annual Leave', 'Emergency Leave', 'Other']
export const EVENT_TYPES = ['Call', 'Meeting', 'Review', 'Personal', 'Blocked']
export const EVENT_CATEGORIES = [
  { key: 'personal', icon: '🧑', label: 'Personal / Internal', desc: 'Team huddle, internal review' },
  { key: 'client', icon: '🤝', label: 'Client Meeting', desc: 'Call or visit with a lead/client' },
  { key: 'team', icon: '👥', label: 'Team Call', desc: 'Group call with your team' },
  { key: 'company', icon: '🏢', label: 'Company', desc: 'Management or cross-team' },
]
export const ZONES = ['JVC', 'Downtown Dubai', 'Dubai Marina', 'Palm Jumeirah', 'Business Bay', 'Al Barsha', 'Jumeirah', 'DIFC', 'JBR', 'Mirdif', 'Dubai South', 'Dubai Hills']
export const TIERS = ['Luxury', 'Mid-Range', 'Affordable', 'Ultra-Luxury']
export const LISTING_STATUS = ['Available', 'Sold Out', 'Coming Soon', 'Off Plan']
export const UNIT_STATUS = ['Available', 'Held', 'Sold']

export const LEAD_STATUS = {
  active: { label: 'Active', tone: 'blue' },
  won: { label: 'Closed · Won', tone: 'green' },
  unable: { label: 'Unable to Close', tone: 'amber' },
  cancelled: { label: 'Cancelled', tone: 'red' },
}

export const DEFAULT_SETTINGS = {
  roundRobin: true,
  autoAssign: false,
  unassignedHours: 4,
  missedFollowup: true,
  unassignedAlerts: true,
  payrollReminders: true,
  leaveAlerts: true,
  inactivityHours: 48,
}
