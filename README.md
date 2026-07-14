# Baggo Bags POS 2 — full app

## What's included
**Backend**
- **Batch slot system** (`models/StockBatch.ts`) — create slots BGA1...BGA999, assign one per product at upload time (`POST /api/stock-batches`, then reference it in `POST /api/products`).
- **Batch-based order IDs** (`models/Order.ts`, pre-save hook) — `{batchCode}{S|P}{3-digit unique}`, e.g. `BGA1S301`. S = Collection, P = Parcel.
- **4-stage SMS lifecycle** (`lib/orderLifecycle.ts`, `lib/smsService.ts`) — Pending → OnTransit → Arrived → Collected/Dispatched, exact SMS copy as specified, sent via Africa's Talking (swap in `lib/smsService.ts` for a different gateway). Branch guard prevents marking a Collection order "Dispatched" or vice versa.
- **Staff-facing order editing** (`PATCH /api/orders/[id]`) — teller/admin edits on the buyer's behalf. Locked once `Collected`/`Dispatched`. Every edit logged with who/when/what changed.
- NextAuth credentials login (`app/api/auth/[...nextauth]/route.ts`) using your existing `User` model + bcrypt password hashes.
- Full model layer in TypeScript: Category, User, Commission, Notification, StockLog, StockBatch, Order, Product.
- API routes: orders (create/list/get/edit/advance-stage), products (create/list), stock-batches (create/list), categories (create/list), notifications (list/mark-read), admin stats, teller stats.

**Frontend**
- `app/layout.tsx`, `components/Header.tsx`, `Sidebar.tsx`, `BottomNav.tsx`, `AuthProvider.tsx` — full app shell.
- `context/CartContext.tsx` — cart state for the shop.
- `app/login/page.tsx` — sign-in.
- `app/page.tsx` — dashboard (admin vs teller views), ported from your original.
- `app/shop/page.tsx` — product grid, cart drawer, checkout (customer details, delivery type, payment, discount) → creates the order.
- `app/shop/receipt/[id]/page.tsx` + `components/Receipt.tsx` + `PrintButton.tsx` — printable receipt.
- `app/orders/page.tsx` — searchable/filterable order list.
- `app/orders/[id]/page.tsx` — order detail: stage log, the one-tap next-stage button (`OrderStageActions.tsx`), and the staff edit form.
- `app/products/page.tsx` + `app/products/new/page.tsx` — product list and upload (with category + batch-slot pickers, dynamic variant rows).
- `app/admin/stock-batches/page.tsx` — create/view BGA slots.
- `app/notifications/page.tsx` — notification feed.

## What's still on you
- **`/admin/users`, `/reports`, `/admin/commissions`, `/profile`** pages are linked in the nav but not built — same idea as the `products`/`orders` pages above, just say the word and I'll build any of them out.
- A `public/manifest.json` for PWA support (referenced in the layout metadata) — trivial to add, wasn't specified.
- Seed at least one admin user directly in MongoDB to log in for the first time (hash a password with bcrypt and insert manually, or I can write you a seed script).

## Assumptions made (flag if wrong)
1. **Batch assignment is per product-upload**, not per-sale — a product keeps its BGA code until you restock it into a different slot.
2. **SMS gateway is Africa's Talking** — env vars `AT_USERNAME`, `AT_API_KEY`, `AT_SENDER_ID`.
3. **"Instore Collected" vs "Parcel Dispatch"** is decided by `deliveryType` chosen at sale time (`Collection` or `Parcel`).
4. **Order editing is staff-only** (confirmed by you — buyers don't log in).

## Env vars needed
```
MONGODB_URI=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
PUSHER_APP_ID=
PUSHER_KEY=
PUSHER_SECRET=
PUSHER_CLUSTER=
AT_USERNAME=
AT_API_KEY=
AT_SENDER_ID=
```
