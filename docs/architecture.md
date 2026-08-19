# Architecture & System Design — ERCoffeeLab Admin Panel

## 1. System Overview & Technology Stack

The **ERCoffeeLab Admin Panel** (`apps/admin`) is a single-page application (SPA) style Web CMS built with **Next.js 15 (App Router)** and **React 19**. It operates as the primary administration web client consuming the centralized **ERCoffeeLab Backend API** (`apps/api` at `http://localhost:3000`).

```text
┌─────────────────────────────────────────────────────────────┐
│               Admin Panel Client (apps/admin)               │
│                  Next.js 15 App Router                      │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP REST (JSON) + Bearer JWT
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 Central Backend (apps/api)                  │
│                Next.js 15 API Routes (Port 3000)            │
│               Neon Postgres DB + Raw SQL Layer              │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack
- **Framework**: Next.js 15 (App Router)
- **UI & Layout**: React 19, Vanilla CSS Tokens (`ERCoffeeLabAdmin.tsx` token set)
- **Icons**: Lucide React (`lucide-react`)
- **HTTP & State**: Standard Web `fetch` with API Wrapper, React Hooks (`useState`, `useCallback`, `useMemo`, `useEffect`)
- **Authentication**: JWT stored in HttpOnly session cookies & browser `localStorage`

---

## 2. Directory Structure

```text
apps/admin/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx            # Login Page (Email+Password & Google SSO)
│   │   └── sso-callback/
│   │       └── page.tsx            # OAuth SSO Callback Token Capture
│   ├── (protected)/
│   │   ├── layout.tsx              # Main Layout with Sidebar & Header
│   │   ├── dashboard/
│   │   │   └── page.tsx            # Executive Dashboard & Live Alerts
│   │   ├── orders/
│   │   │   ├── page.tsx            # Orders Management & Real-time Live Alert
│   │   │   └── [id]/page.tsx       # Order Detail & Status Transition
│   │   ├── menu/
│   │   │   └── page.tsx            # Outlet Menu Management (Availability & Overrides)
│   │   ├── products/
│   │   │   └── page.tsx            # Super Admin Master Product Management
│   │   ├── outlets/
│   │   │   └── page.tsx            # Super Admin Outlets Management
│   │   ├── vouchers/
│   │   │   └── page.tsx            # Super Admin Voucher Campaigns
│   │   ├── loyalty/
│   │   │   └── page.tsx            # Super Admin Loyalty Tiers & Rewards
│   │   ├── notifications/
│   │   │   └── page.tsx            # Super Admin Notification Templates & Logs
│   │   └── staff/
│   │       └── page.tsx            # Super Admin Staff User Management
│   ├── api/
│   │   ├── set-session/route.ts    # Route handler to write session cookie
│   │   └── logout/route.ts         # Route handler to clear session cookie
│   ├── layout.tsx                  # Root layout & font injection
│   └── page.tsx                    # Root redirect (to /dashboard or /login)
├── components/
│   ├── Sidebar.tsx                 # Dynamic Role-based Navigation Sidebar
│   ├── Topbar.tsx                  # Header Topbar with Outlet Switcher & Staff Profile
│   ├── OrderAlertToast.tsx         # Live Order Notification Toast Component
│   └── ui/                         # Reusable UI components (Modal, Badge, Drawer)
└── lib/
    ├── api-client.ts               # Custom fetch wrapper with Bearer Token header
    └── auth.ts                     # Session token parser & permission helper
```

---

## 3. Authentication & Session Architecture

### 3.1 Dual Authentication Paths
1. **Google OAuth SSO Path**:
   - User clicks **Sign in with Google** ➔ Redirected to Google OAuth consent screen.
   - Redirected back to `/sso-callback?token=<jwt_token>`.
   - Client posts token to `/api/set-session` to write HttpOnly cookie `session`.
2. **Email + Password Demo Path**:
   - User submits login form to `POST http://localhost:3000/api/auth/staff/login`.
   - API returns JWT token and staff payload.
   - Client posts token to `/api/set-session` and redirects to `/dashboard`.

### 3.2 Middleware & Route Protection (`middleware.ts`)
- Next.js Edge Middleware checks for `session` cookie on all requests under `/(protected)/`.
- If missing or expired ➔ Redirects to `/login`.
- For role-restricted pages (`/staff`, `/products`, `/outlets`, `/vouchers`, `/loyalty`, `/notifications`), server-side check verifies `payload.role === 'super_admin'`. If unauthorized ➔ Redirects to `/dashboard` or renders 403 Forbidden page.

---

## 4. API Client Integration & Request Flow

All API calls to `apps/api` pass through the central `apiClient` helper ([`lib/api-client.ts`](file:///e:/PKL/ercoffeelab/apps/admin/lib/api-client.ts)):

```typescript
// Conceptual API Client Wrapper
export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${baseUrl}${endpoint}`, { ...options, headers });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "An error occurred");
  }

  return data;
}
```

---

## 5. Role Scoping & Dynamic Layout

### Header Outlet Switcher Logic (`Topbar.tsx`):
- If `staff.role === 'super_admin'`:
  - Dropdown renders options: `[ All Outlets (Global) ]`, `ERCoffeeLab Bandung`, `ERCoffeeLab Jakarta`, etc.
  - Selecting an outlet filters state across Dashboard, Live Orders, and Outlet Menu.
- If `staff.role === 'outlet_admin'`:
  - Dropdown is disabled/hidden.
  - Header displays locked badge: 📍 **Outlet: ERCoffeeLab Bandung**.
  - All API calls automatically query data scoped to `staff.outletId`.
