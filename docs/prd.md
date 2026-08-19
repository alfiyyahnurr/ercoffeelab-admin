# Product Requirements Document (PRD) — ERCoffeeLab Admin Panel

## 1. Executive Summary
The **ERCoffeeLab Admin Panel** (`apps/admin`) is a web-based Content Management System (CMS) and operational dashboard designed for coffee shop enterprise management. Built with **Next.js 15 (App Router)**, it connects seamlessly to the central backend REST API (`apps/api` running at `http://localhost:3000`).

The system enforces strict role-based access control (RBAC) separating **Super Admin** (global enterprise control) and **Outlet Admin** (branch-level operations).

---

## 2. Target Users & User Roles

### A. Super Admin (`super_admin`)
- **Profile**: Headquarters executive, owner, or general manager.
- **Responsibilities**:
  - Full system governance across all coffee shop outlets.
  - Creating and managing master products, categories, base prices, and addons.
  - Adding new outlets, operating hours, and geo-locations.
  - Configuring promotional campaigns, vouchers, and loyalty tiers.
  - Managing staff accounts, access permissions, and authentication paths.
  - Viewing enterprise-wide revenue analytics and outlet performance comparisons.

### B. Outlet Admin (`outlet_admin`)
- **Profile**: Branch manager, barista lead, or local store supervisor.
- **Responsibilities**:
  - Managing daily store operations for their assigned outlet (`outletId`).
  - Receiving real-time live order alerts and processing order status transitions (`preparing` ➔ `ready` ➔ `completed`).
  - Toggling local menu item availability (In Stock / Out of Stock).
  - Overriding menu prices for their local store (`priceOverride`) without altering master base prices.
  - Toggling local payment methods accepted at their store.

---

## 3. Core Functional Requirements

### 3.1 Authentication & Authorization
- **Dual Login Paths**:
  1. **Google OAuth SSO**: Enterprise staff authentication (`/sso-callback`).
  2. **Email + Password Demo Login**: Alternative authentication path (`POST /api/auth/staff/login`) for demo/testing accounts.
- **Role-Based Navigation Scoping**:
  - Admin Panel sidebar dynamically hides management modules (`/staff`, `/outlets`, `/products`, `/vouchers`, `/loyalty`, `/notifications`) when logged in as `outlet_admin`.
- **Outlet Scope Enforcement**:
  - `outlet_admin` users are permanently locked to their assigned outlet (`outletId`). The outlet switcher dropdown in the header is disabled/hidden.
  - `super_admin` users have a global outlet switcher dropdown in the top header (`All Outlets (Global)` or filter by specific outlet).

### 3.2 Live Orders & Order Lifecycle Management (`/orders`)
- **Real-Time Live Order Alerts**:
  - Periodic polling (10-15s interval) checking `GET /api/outlets/:id/alerts?unacknowledged=true`.
  - Audio/Visual toast notifications when new customer orders are placed.
- **Order Status Transitions**:
  - `pending` ➔ `paid` ➔ `preparing` ➔ `ready` ➔ `completed` / `cancelled`.
  - Detailed view showing customer details, items, sizes, temperature, ice, sugar, addons, subtotal, discount, service fee, and total.

### 3.3 Menu & Pricing Management (`/menu` & `/products`)
- **Master Product Management (Super Admin Only)**:
  - Create, edit, and delete master products (`name`, `type: 'beverage'|'food'`, `categoryId`, `basePrice`, `description`, `addons`).
  - Changing `basePrice` updates the price for all outlets that do not have a custom price override.
- **Outlet Menu Customization (Outlet Admin & Super Admin)**:
  - **Availability Toggle**: Turn menu items ON (Available) or OFF (Out of Stock) for a specific outlet.
  - **Local Price Override**: Override master `basePrice` with a store-specific price (`priceOverride`).
  - **Reset to Base Price**: Clear local override and revert to central master base price.

### 3.4 Outlets & Location Governance (`/outlets`)
- Manage outlet master records (`name`, `address`, `phone`, `operatingHours`, `isOperating`, `latitude`, `longitude`).
- Map view integration showing store locations.

### 3.5 Vouchers & Promotional Campaigns (`/vouchers`)
- Create and manage promo vouchers (`name`, `description`, `code`, `discountType: 'percent'|'fixed'`, `discountValue`, `maxDiscount`, `minPurchase`, `validFrom`, `validUntil`, `usageLimit`, `isActive`).

### 3.6 Loyalty Tiers & Rewards Catalog (`/loyalty`)
- **Loyalty Tiers**: Define customer membership tiers (`Bronze`, `Silver`, `Gold`, `Platinum`) with `minPoints`, `minOrders`, `benefitNote`, and `sortOrder`.
- **Rewards Catalog**: Define point redemption items (`name`, `pointCost`, `description`).

### 3.7 Payment Methods (`/payment-methods`)
- Manage global payment options (Midtrans QRIS, Credit Card, Bank Transfer, Cash).
- Enable/disable payment options globally or per-outlet.

### 3.8 Notification Templates & Audit Logs (`/notifications`)
- **Templates**: Configure automated WhatsApp/email template messages (`code`, `channel: 'whatsapp'|'email'`, `subject`, `bodyTemplate`).
- **Audit Logs**: View log history of rendered and dispatched notifications (`templateCode`, `target`, `payload`, `status`).

### 3.9 Staff User Management (`/staff`)
- Super Admin dashboard to create, update, and deactivate staff accounts (`email`, `fullName`, `role: 'super_admin'|'outlet_admin'`, `outletId`, `password`).
- Supports password hashing via `bcryptjs` or setting `password_hash = NULL` for SSO-only staff.

---

## 4. Non-Functional Requirements
- **Design Aesthetic**: Premium Luxury Coffee CMS design matching `ERCoffeeLabAdmin.tsx` (Deep Navy `#0E1230`, Classic Navy `#181F4B`, Accent Gold `#C9A876`, Cream `#F6F3EC`).
- **Responsive Layout**: Collapsible sidebar, optimized for Desktop (1024px+) and Tablet devices.
- **Typography**: Google Fonts **Albert Sans** (Display/Headings) and **Source Sans 3** (Body text).
