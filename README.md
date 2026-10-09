# Demo Company CRM

Real-estate sales CRM demo. All data is sample data, saved in the visitor's browser (no backend, no database).

## Demo logins

Password for every account: `demo1234`

1. Super Admin — admin@democompany.com
2. Sales Manager (Bangalore) — manager@democompany.com
3. Sales Manager (Dubai) — manager.dubai@democompany.com
4. CRM Executive — executive@democompany.com

Other staff (priya@, rahul@, neha@, omar@, fatima@, daniel@democompany.com) also log in as CRM Executive.

## Run locally

1. npm install
2. npm run dev
3. Open http://localhost:5173

## Deploy on Vercel

1. Push this folder to a GitHub repo
2. In Vercel → Add New Project → import the repo
3. Framework is detected as Vite — click Deploy

## Features

1. Role-based login (Super Admin, Sales Manager, CRM Executive) with different menus
2. Leads — search, filters, bulk status change, CSV export, new lead, log activity, flag
3. Lead detail — 11-stage SOP, Bangalore → Dubai handover, approvals, cancel / unable to close, follow-ups, reassignment request
4. Approvals — Executive → Sales Manager → Super Admin
5. Team overview, lead pipeline (drag and drop), source performance
6. AI lead distribution and agent workload
7. Escalations (Super Admin)
8. Site visits
9. Property inventory — projects, units, add / delete property, unit status, photos
10. Org chart and people directory, add / edit / deactivate members
11. Leave management with approvals
12. Flags & warnings
13. Audit log, payroll sign-off, reports center with CSV downloads
14. Shared calendar, team chat (direct + groups), notifications
15. Settings, dark mode, profile, reset demo data

## Change sample data

1. Company name, domain, password — `src/data/constants.js`
2. Staff, projects, leads — `src/data/seed.js`
