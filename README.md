# 🏠 Stellar Analytics ROI
### Property Intelligence Platform — Stellar Properties and Enterprises LLC

> **One platform to manage bids, expenses, tenants, flips, and ROI — for every property in your portfolio.**

🌐 **Live at:** [stellaranalyticsroi.com](https://stellaranalyticsroi.com)  
🔐 **Access:** Invitation only — Google Sign-In  
🌍 **Language:** English & Español (toggle on every page)

---

## 📌 Purpose & Vision

Stellar Analytics ROI was built to solve a real problem faced by property investors and house flippers: financial data is scattered across spreadsheets, texts, emails, and receipts — making it nearly impossible to know your true ROI on any given project in real time.

The platform is designed to become a **single source of truth** for every dollar that touches a property — from the day you acquire it to the day you sell it.

**Vision:** A 1-stop shop to manage properties, bid jobs, manage tenants, manage flips, and keep a real-time view of expenses, ROI, and P&L across your entire portfolio.

---

## ⚡ Current Functions (Live)

### 1️⃣ Bid & Contractor Portal
`/bid` — or project-specific: `/bid?project=ID`

- Contractors submit bids from their phone — no login required
- Full labor + materials line items with auto-totaling grand total
- Attach photos or PDFs (receipts, plans, quotes) — stored in cloud storage
- Project-specific links pre-fill and lock the property dropdown
- All bids go to a pending review queue — **zero effect on actual costs until approved**
- Owner actions: Accept, Reject, or Request Revision with a note
- Approved bids auto-populate Labor and Materials actuals in the project P&L
- Payment tracking: log partial payments, track paid vs. outstanding per contractor

---

### 2️⃣ Expense Reimbursement Portal
`/expense` — or project-specific: `/expense?project=ID`

- Anyone submits expenses from their phone — no login required
- Select who paid (Robbie, Aasif, Douglas, Chris, or custom name)
- Multiple line items per submission
- Upload receipt photo or PDF — viewable with one click in the dashboard
- Expenses go to the Expense Queue — **pending until owner approves**
- On approval, expense automatically adds to project's actual costs in P&L
- Reimbursement tracking: fully or partially reimbursed, outstanding balances by person and project

---

### 3️⃣ Project P&L Dashboard
`/project?id=PROJECT_ID`

- Flip-specific P&L: Purchase → Rehab → Holding → Selling → Revenue
- **Estimated vs. Actual vs. Difference** — costs auto-fill from approved bids and expenses
- Loan disbursement tracked as income (reduces net out-of-pocket cost)
- Auto-calculated: net profit/loss, ROI %, profit margin
- Color coding: costs in red, income in green
- Date filters: All time / This month / This quarter / This year / Custom range
- **4 tabs per project:** P&L · Bids · Expenses · Charts

---

## 🖥️ Owner Dashboard

| Tab | Purpose |
|-----|---------|
| Dashboard | Live metrics across all projects — bids, expenses, actuals, unreimbursed |
| Bid Queue | Review pending bids — approve, reject, or request revision |
| All Bids | Full bid history across all projects, filterable by date |
| Payments | Log partial payments per contractor per approved bid |
| Expenses | Quick manual expense entry |
| Expense Queue | Approve or reject pending expense submissions |
| Reimbursements | Track who's been paid back — by person and by project |
| People & Subs | Every contractor and partner with full transaction history |
| Projects | Manage all properties + quick-copy bid/expense links per project |

---

## 🔐 Access & Security

- **Google Sign-In** via Supabase Auth — no passwords
- **Whitelist-only** — non-approved accounts are blocked
- **Role-based access** — owners see all projects; partners see only assigned projects
- **Public forms** (bid & expense) — no login required, anyone with the link can submit
- **Row-level security** on every Supabase table

### Approved Users
| Name | Email | Role |
|------|-------|------|
| Robbie | robbieski1@gmail.com / robbie@gostellarinc.com | Owner |
| Aasif | aasifosmany08@gmail.com | Partner |
| Chris Nielson | bcprocon@gmail.com | Partner |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML / CSS / JavaScript (no framework) |
| Database | Supabase (PostgreSQL) |
| File Storage | Supabase Storage |
| Auth | Supabase Auth + Google OAuth |
| Hosting | Vercel |
| Domain | stellaranalyticsroi.com |
| Charts | Chart.js |
| i18n | Custom EN/ES translation module |

---

## 🗄️ Database Tables

| Table | Purpose |
|-------|---------|
| `projects` | All properties — address, partners, creation date |
| `bids` | Contractor bid submissions with status and amounts |
| `bid_line_items` | Labor and material line items per bid |
| `payments` | Partial payment records per approved bid |
| `reimbursement_expenses` | Expense submissions with files and reimbursement tracking |
| `project_pl` | Saved P&L estimates and actuals per project |
| `allowed_users` | Whitelist of approved emails and roles |

---

## 🗺️ Product Roadmap

### ✅ Live Now
- [x] Bid & Contractor Portal
- [x] Expense Reimbursement Portal
- [x] Project P&L Dashboard (flip-specific)
- [x] Owner Dashboard with 9 tabs
- [x] Google Auth + whitelist + role-based access
- [x] Full English / Español toggle
- [x] Receipt photo upload & lightbox viewer
- [x] Project-specific shareable bid and expense links
- [x] Inline spreadsheet-style expense editing

### 🔜 Coming Next
- [ ] Tenant management (profiles, lease dates, rent amounts)
- [ ] Rent tracking (due vs. paid per unit, late payment flags)
- [ ] Maintenance request portal (tenants submit, owner routes to contractors)
- [ ] Multi-property portfolio view with combined P&L

### 🔮 Future
- [ ] Lease document storage
- [ ] Mortgage & loan disbursement schedule tracking
- [ ] Tax & depreciation report exports
- [ ] Contractor CRM (ratings, history across properties)
- [ ] Native mobile app (iOS / Android)

---

## 🔗 Quick Links

| Page | URL |
|------|-----|
| Landing Page | stellaranalyticsroi.com |
| Owner Dashboard | stellaranalyticsroi.com/dashboard |
| Bid Form | stellaranalyticsroi.com/bid |
| Expense Form | stellaranalyticsroi.com/expense |
| Project Dashboard | stellaranalyticsroi.com/project?id=PROJECT_ID |
| Project Bid Link | stellaranalyticsroi.com/bid?project=PROJECT_ID |
| Project Expense Link | stellaranalyticsroi.com/expense?project=PROJECT_ID |

---

*© 2026 Stellar Properties and Enterprises LLC — Confidential*
