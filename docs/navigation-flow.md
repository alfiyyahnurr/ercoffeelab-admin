# Navigation Flow & Route Specifications — ERCoffeeLab Admin Panel

## 1. Page Map & App Router Directory Structure

```text
/login
  ├─ [Form] Email + Password ──────────────────────────────────────┐
  └─ [Button] Sign in with Google ──▶ OAuth Consent ──▶ /sso-callback ┤
                                                                     ▼
                                                     POST /api/set-session (Write Cookie)
                                                                     ▼
                                                             Redirect /dashboard

/(protected) (Layout with Sidebar & Header)
  ├─ /dashboard                      # Executive Dashboard & Live Alert Monitoring
  ├─ /orders                         # Live Orders List & Quick Filter
  │    └─ /orders/[id]               # Order Details & Status Transition Actions
  ├─ /menu                           # Outlet Menu Management (Available Toggle & Price Override)
  ├─ /products                       # (Super Admin) Master Products & Addons
  ├─ /outlets                        # (Super Admin) Outlet Locations & Operating Status
  ├─ /vouchers                       # (Super Admin) Promotional Voucher Campaigns
  ├─ /loyalty                        # (Super Admin) Loyalty Tiers & Rewards Catalog
  ├─ /notifications                  # (Super Admin) WA/Email Notification Templates & Logs
  └─ /staff                          # (Super Admin) Staff User Accounts & Password Management
```

---

## 2. Navigation Scoping Matrix by User Role

| Route | `super_admin` Access | `outlet_admin` Access |
|---|---|---|
| `/dashboard` | ✅ Full access (All outlets analytics & dropdown switcher) | ✅ Scoped access (Assigned outlet stats & orders alert) |
| `/orders` | ✅ View all orders across all outlets | ✅ View & process live orders for assigned outlet |
| `/orders/[id]` | ✅ View & change any order status | ✅ Change status for assigned outlet orders (`preparing` ➔ `ready` ➔ `completed`) |
| `/menu` | ✅ View & manage menu across any outlet | ✅ Manage local menu `isAvailable` toggle & `priceOverride` |
| `/products` | ✅ Create, edit, and delete master products | ❌ Hidden / Restricted |
| `/outlets` | ✅ Create, edit, and delete outlet stores | ❌ Hidden / Restricted |
| `/vouchers` | ✅ Create, edit, and toggle promo vouchers | ❌ Hidden / Restricted |
| `/loyalty` | ✅ Manage loyalty tiers & reward catalog | ❌ Hidden / Restricted |
| `/notifications` | ✅ Manage message templates & view audit logs | ❌ Hidden / Restricted |
| `/staff` | ✅ Manage staff accounts & authentication | ❌ Hidden / Restricted |

---

## 3. Detailed Sequence Flows

### 3.1 Live Order Alert & Processing Sequence
```text
Dashboard (Mounted)
   │
   ├──▶ Polling GET /api/outlets/:id/alerts?unacknowledged=true (every 10-15s)
   │
   ├──▶ Unacknowledged order detected!
   │       │
   │       ├── Play notification alert chime 🎵
   │       └── Render Toast Alert ("New Order #ERC-20260818-001 Received!")
   │
   └── User clicks Toast ──▶ Navigate to /orders/:id
                               │
                               ├── Update order status (PATCH /api/orders/:id/status -> "preparing")
                               └── Acknowledge alert (PATCH /api/outlets/:id/alerts -> acknowledged)
```

### 3.2 Outlet Menu Price Override Sequence
```text
Outlet Admin navigates to /menu
   │
   ├── GET /api/outlets/:outletId/menu
   │     └─ Returns menu items with basePrice, priceOverride, and isAvailable
   │
   ├── Outlet Admin edits price field (e.g. from Rp 25.000 to Rp 28.000)
   │
   └── Submits change ──▶ PATCH /api/outlets/:outletId/menu/:productId
                             - Body: { priceOverride: 28000 }
                             - Response: Updated effective price = Rp 28.000
```