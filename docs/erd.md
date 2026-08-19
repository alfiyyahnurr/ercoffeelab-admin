# ERD & Data Schema Reference — ERCoffeeLab Admin Panel

All data consumed by the Admin Panel (`apps/admin`) is retrieved from the Neon Postgres database via `apps/api`. All primary and foreign keys use **`BIGSERIAL` / `BIGINT`** auto-increment integers starting from `1`, `2`, `3`.

API responses are formatted in **`camelCase`**.

---

## Data Schema & DTO Contract Definitions

### 1. Staff Users (`staff_users`)
| Field | Type | Description |
|---|---|---|
| `id` | `number` | Unique Staff ID (`BIGSERIAL`) |
| `email` | `string` | Unique staff email address |
| `fullName` | `string` | Staff member's full name |
| `role` | `'super_admin' \| 'outlet_admin'` | Staff access role |
| `outletId` | `number \| null` | Null for `super_admin`, assigned outlet ID for `outlet_admin` |
| `outletName` | `string \| null` | Joined outlet name |
| `hasPassword` | `boolean` | Flag indicating if staff has password or is SSO-only |
| `isActive` | `boolean` | Account active status |
| `createdAt` | `string` | ISO 8601 creation timestamp |

*Note: `password_hash` is strictly excluded from API responses.*

---

### 2. Outlets (`outlets`)
| Field | Type | Description |
|---|---|---|
| `id` | `number` | Unique Outlet ID (`BIGSERIAL`) |
| `name` | `string` | Store name (e.g. "ERCoffeeLab Bandung") |
| `address` | `string` | Full store address |
| `phone` | `string \| null` | Store phone number |
| `operatingHours` | `string \| null` | Operating hours string (e.g. "07:00 - 22:00") |
| `isOperating` | `boolean` | Operating active status |
| `latitude` | `number \| null` | Map coordinate latitude |
| `longitude` | `number \| null` | Map coordinate longitude |
| `createdAt` | `string` | ISO 8601 timestamp |

---

### 3. Master Products (`products`) & Categories (`categories`)
| Field | Type | Description |
|---|---|---|
| `id` | `number` | Unique Product ID (`BIGSERIAL`) |
| `categoryId` | `number` | Foreign key to `categories.id` |
| `categoryName` | `string` | Category name (e.g. "Coffee", "Bakery") |
| `name` | `string` | Master product name |
| `type` | `'beverage' \| 'food'` | Product type classifier |
| `basePrice` | `number` | Base price in IDR |
| `description` | `string \| null` | Master product description |
| `imageUrl` | `string \| null` | Product image URL (e.g. "/uploads/products/1700000000_coffee.jpg") |
| `addons` | `Array<{ id, name, extraPrice }>` | Optional extra addons list |


---

### 4. Outlet Menu Items (`product_outlets`)
| Field | Type | Description |
|---|---|---|
| `productId` | `number` | Master Product ID |
| `outletId` | `number` | Target Outlet ID |
| `name` | `string` | Master Product name |
| `categoryName` | `string` | Category name |
| `type` | `'beverage' \| 'food'` | Product type |
| `basePrice` | `number` | Master base price (Harga Awal / Default Pusat) |
| `price` | `number` | Effective outlet price (`priceOverride ?? basePrice` — automatically defaults to `basePrice` if not edited) |
| `priceOverride` | `number \| null` | Custom price override (null = not edited, automatically uses `basePrice`) |
| `isAvailable` | `boolean` | Availability status at this outlet |


---

### 5. Orders (`orders`) & Order Details (`order_details`)
| Field | Type | Description |
|---|---|---|
| `id` | `number` | Unique Order ID (`BIGSERIAL`) |
| `orderNumber` | `string` | Formatted order code (e.g. "ERC-20260818-001") |
| `customerId` | `number \| null` | Customer ID |
| `customerName` | `string \| null` | Customer name |
| `customerPhone` | `string \| null` | Customer phone number |
| `outletId` | `number` | Target Outlet ID |
| `outletName` | `string` | Outlet name |
| `fulfillmentType` | `'pickup' \| 'delivery'` | Order fulfillment method |
| `deliveryAddress` | `string \| null` | Delivery address |
| `paymentMethodId` | `number` | Payment method ID |
| `paymentMethodName` | `string` | Payment method display name |
| `subtotal` | `number` | Sum of item prices |
| `discount` | `number` | Applied discount amount |
| `voucherId` | `number \| null` | Applied voucher ID |
| `serviceFee` | `number` | Service fee |
| `total` | `number` | Final total amount (`subtotal - discount + serviceFee`) |
| `paymentStatus` | `'unpaid' \| 'paid' \| 'failed' \| 'refunded'` | Payment status |
| `orderStatus` | `'pending' \| 'paid' \| 'preparing' \| 'ready' \| 'completed' \| 'cancelled'` | Order workflow status |
| `paidAt` | `string \| null` | Payment completion timestamp |
| `createdAt` | `string` | Order creation timestamp |
| `items` | `Array<OrderItem>` | Detailed item list (qty, size, temperature, sugar, ice, addons) |

---

### 6. Vouchers (`vouchers`)
| Field | Type | Description |
|---|---|---|
| `id` | `number` | Unique Voucher ID (`BIGSERIAL`) |
| `name` | `string \| null` | Promo name (e.g. "Diskon Pelanggan Baru 20%") |
| `description` | `string \| null` | Detailed description |
| `code` | `string` | Voucher promo code (e.g. "WELCOME20") |
| `discountType` | `'percent' \| 'fixed'` | Discount calculation type |
| `discountValue` | `number` | Discount percentage or fixed IDR amount |
| `maxDiscount` | `number \| null` | Maximum discount cap for percent type |
| `minPurchase` | `number` | Minimum required subtotal purchase |
| `validFrom` | `string \| null` | Start timestamp |
| `validUntil` | `string \| null` | Expiration timestamp |
| `usageLimit` | `number \| null` | Total usage limit |
| `isActive` | `boolean` | Voucher active status |

---

### 7. Loyalty Tiers (`loyalty_tiers`) & Rewards (`rewards`)
- **Loyalty Tier Schema**: `{ id, name, minPoints, minOrders, benefitNote, sortOrder }`
- **Reward Schema**: `{ id, name, pointCost, description }`

---

### 8. Notification Templates (`notification_templates`) & Logs (`notification_logs`)
- **Notification Template Schema**: `{ id, code, channel, subject, bodyTemplate, isActive, createdAt }`
- **Notification Log Schema**: `{ id, templateCode, orderId, orderNumber, customerId, customerName, channel, target, payload, status, createdAt }`
