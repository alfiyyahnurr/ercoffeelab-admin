# Implementation Todo List — ERCoffeeLab Admin Panel (`apps/admin`)

Actionable checklist for scaffolding and building the Admin Panel in `apps/admin` using Next.js 15 App Router.

---

## 🏗️ Phase 1: Project Scaffolding & Design System Setup
- [x] Initialize Next.js 15 App Router project in `apps/admin`
- [x] Configure `tailwind.config.ts` or `index.css` with exact Brand Token Palette (`NAVY`, `GOLD`, `CREAM`, `MIST`, `LINE`, `INK`)
- [x] Inject Google Fonts (`Albert Sans` & `Source Sans 3`) in `app/layout.tsx`
- [x] Install `lucide-react` for UI icons
- [x] Create `lib/api-client.ts` wrapper with automatic `Authorization: Bearer <token>` header injection

---

## 🔐 Phase 2: Authentication & Route Protection
- [x] Build `/login` page with dual authentication options (Email+Password Demo & Google SSO)
- [x] Build `/sso-callback` page to capture JWT token from OAuth redirect
- [x] Create `/api/set-session` and `/api/logout` route handlers
- [x] Implement Next.js `middleware.ts` for session cookie validation and automatic redirection

---

## 🖥️ Phase 3: Core App Layout & Role Scoping
- [x] Build dynamic `Sidebar.tsx` with role-based navigation item filtering (`super_admin` vs `outlet_admin`)
- [x] Build `Topbar.tsx` header with Outlet Switcher Dropdown (`super_admin` only) and Outlet Lock Badge (`outlet_admin`)
- [x] Build `OrderAlertToast.tsx` component with periodic polling (10-15s) for live order alerts

---

## 📦 Phase 4: Page Modules & API Consumers

### 4.1 Executive Dashboard (`/dashboard`)
- [x] Build `/dashboard` page displaying revenue KPIs, order counts, and live alert widget

### 4.2 Live Orders (`/orders` & `/orders/[id]`)
- [x] Build `/orders` list page with quick filter status tabs (`All`, `Pending`, `Preparing`, `Ready`, `Completed`)
- [x] Build `/orders/[id]` detail page with status transition buttons (`preparing` ➔ `ready` ➔ `completed`)

### 4.3 Outlet Menu Management (`/menu`)
- [x] Build `/menu` page displaying outlet products
- [x] Implement `isAvailable` toggle switch
- [x] Implement `priceOverride` input field and *"Reset to Base Price"* button

### 4.4 Master Products (Super Admin Only - `/products`)
- [x] Build `/products` master table with category filters
- [x] Build Add/Edit Master Product modal & Addon manager
- [x] Implement product deletion cascade check

### 4.5 Outlets Governance (Super Admin Only - `/outlets`)
- [x] Build `/outlets` store management list page with operating status badges
- [x] Build Add/Edit Outlet modal (Address, Phone, Operating Hours, Lat/Lng coordinates)

### 4.6 Vouchers & Campaigns (Super Admin Only - `/vouchers`)
- [x] Build `/vouchers` promo campaigns table with usage limits and valid date range
- [x] Build Add/Edit Voucher modal with promo code uniqueness check and discount validation

### 4.7 Loyalty Tiers & Rewards (Super Admin Only - `/loyalty`)
- [x] Build `/loyalty` page with Loyalty Tier manager and Rewards Catalog

### 4.8 Notifications & Audit Logs (Super Admin Only - `/notifications`)
- [x] Build `/notifications` page with WA/Email template editor and Notification Audit Log inspector

### 4.9 Staff User Management (Super Admin Only - `/staff`)
- [x] Build `/staff` user accounts table
- [x] Build Add/Edit Staff User modal (Password hash generation & SSO toggle)

---

## 🧪 Phase 5: Verification & Quality Assurance
- [x] Run `npm run build` on `apps/admin` to verify 0 type compilation errors
- [x] Perform E2E flow testing with demo Super Admin (`admin@ercoffeelab.com`)
- [x] Perform E2E flow testing with demo Outlet Admin (`bandung.admin@ercoffeelab.com`)
