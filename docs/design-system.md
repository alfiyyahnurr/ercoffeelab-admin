# Design System & UI Tokens — ERCoffeeLab Admin Panel

The **ERCoffeeLab Admin Panel** follows a **Luxury Coffee CMS** design theme, adopting modern glassmorphism, rich dark palettes, subtle micro-animations, and clean typography. The layout strictly adheres to the visual contract defined in `apps/admin/_reference/ERCoffeeLabAdmin.tsx`.

---

## 1. Color Palette Tokens

| Token Name | Hex Code | Purpose / Usage |
|---|---|---|
| `NAVY` | `#181F4B` | Primary sidebar background, header brand elements, and primary buttons |
| `NAVY_DEEP` | `#0E1230` | Dark background accent, active navigation items, modal backdrops |
| `NAVY_SOFT` | `#3B4B8C` | Soft hover states, secondary borders |
| `GOLD` | `#C9A876` | Brand accent color, primary badges, high-priority highlights, active toggles |
| `CREAM` | `#F6F3EC` | Card backgrounds, table headers, soft container fill |
| `MIST` | `#F4F5F9` | Primary page canvas background |
| `LINE` | `#E7E8F0` | Structural border lines, dividers |
| `INK_1` | `#1E202B` | Primary text color (headings, titles) |
| `INK_2` | `#6B7088` | Muted secondary text color (labels, subtitles, meta) |
| `GREEN` | `#3E8A5A` | Success badges, completed order status, active toggles |
| `RED` | `#C9576B` | Danger/Error actions, out-of-stock badges, delete buttons |

---

## 2. Typography

- **Primary Display Font**: `Albert Sans`, sans-serif (Google Fonts)
- **Secondary Body Font**: `Source Sans 3`, sans-serif (Google Fonts)

### Font Sizes & Weights:
- **Header Title**: `20px` / Bold (`700`) / Font: `Albert Sans` / Color: `NAVY` or `WHITE`
- **Section Heading**: `16px` / SemiBold (`600`) / Font: `Albert Sans` / Color: `INK_1`
- **Body Text**: `14px` / Regular (`400`) / Font: `Source Sans 3` / Color: `INK_1`
- **Secondary Caption**: `12px` / Medium (`500`) / Font: `Source Sans 3` / Color: `INK_2`
- **Price / Metric Value**: `18px - 24px` / Bold (`700`) / Font: `Albert Sans` / Color: `NAVY` or `GOLD`


---

## 3. Core UI Components Specification

### 3.1 Sidebar Navigation (`Sidebar.tsx`)
- Fixed width: `260px` (Collapsible to `72px` mini mode).
- Background: `NAVY_DEEP` (`#0E1230`) with subtle gold border right.
- Active item indicator: Gold accent bar on the left + `GOLD` icon fill + `CREAM` background tint.

### 3.2 Header Top Bar (`Topbar.tsx`)
- Height: `64px`.
- Background: `WHITE` with bottom border `LINE` (`#E7E8F0`).
- Left: Collapsible sidebar trigger + Current Outlet Indicator / Switcher.
- Right: Search input bar + Notification Alert Bell + Staff Profile Badge.

### 3.3 Status Badges (`Badge.tsx`)
- **Paid / Completed**: Background `#EAF5EE`, Text `#3E8A5A`, Border `#C6E7D2`.
- **Preparing / In Progress**: Background `#FEF6E6`, Text `#C9A876`, Border `#F7E5C4`.
- **Pending / Action Needed**: Background `#EDF0FA`, Text `#3B4B8C`, Border `#D2D9F3`.
- **Failed / Cancelled / Out of Stock**: Background `#FDF0F2`, Text `#C9576B`, Border `#FAF1F3`.

### 3.4 Data Tables
- Header: Background `CREAM` (`#F6F3EC`), Text `INK_2` (`#6B7088`), Uppercase `12px` bold.
- Rows: Background `WHITE`, hover transition `MIST` (`#F4F5F9`), border bottom `LINE` (`#E7E8F0`).
- Action Buttons: Subtle icon buttons (`Pencil`, `Trash2`, `Eye`) with gold/red hover focus.

### 3.5 Drawer Panels & Modals
- Glassmorphism backdrop blur (`backdrop-filter: blur(8px)`, background `rgba(14, 18, 48, 0.5)`).
- Slide-over drawer from right for product edits & order details (`width: 480px`).
