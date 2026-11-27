# Fashion Store — Next.js E-commerce Template

A complete, ready-to-run fashion e-commerce website with a separate admin
panel. Shop and admin share the same product / order / category data, but
have separate layouts and separate logins.

- **Shop:** homepage (hero, promos, Best Sellers), product catalogue with
  filters / search / price sort, product detail with size selection, cart,
  checkout, customer account, blog, about, contact.
- **Admin (`/admin`):** dashboard, products, orders, categories, coupons,
  customers, subscribers, messages, staff, settings, and an activity log.
  The admin area has no shop header, footer, or search bar.

The interface is bilingual — Vietnamese by default, with an English
toggle (VI | EN) in the shop header and in the admin header (see
"Languages" below). Sample products use English names and can be
replaced with your own catalogue.

## Tech stack

- Next.js 14 (App Router) + TypeScript + Tailwind CSS
- Prisma ORM — SQLite for local development, Cloudflare D1 in production
- Cloudflare Pages + Cloudflare D1 (deploy with `next-on-pages`)
- Product / order / category / post data goes through `/api/*` routes.
  Accounts and sessions are also server-side: users live in the `users`
  table of D1 (passwords hashed SHA-256 with a per-user salt), sessions
  live in the `sessions` table, and the session token travels in an
  HTTP-only cookie (see "Accounts" below). The cart stays in the
  browser's localStorage — it is not auth data.

## Demo accounts

| Where | Account | Password |
|---|---|---|
| Shop (`/account`) | `demo@store.local` | `demo123` |
| Admin (`/admin`) | `admin@store.local` | `admin123` |

The admin account is a normal row in the `users` table — it logs in with
the hashed password stored in D1, exactly like any other account. Change
its password at `/admin` → Cài đặt & Bảo mật, or with
`node scripts/hash-password.cjs <mat-khau-moi>` and an `UPDATE users`
in the D1 console; the old password stops working immediately.
Shop login rejects admin / staff accounts and tells them to log in at
`/admin` instead — enforced on the server, not just in the UI.
Customers can also register a new account from the **Đăng ký** tab.

> Accounts are authenticated on the server: login, registration, password
> changes, staff management, and the shop/admin separation are all
> enforced by the `/api/auth/*` routes against the D1 database
> (`src/lib/auth.ts`). Passwords are stored as SHA-256 hashes with a
> per-user salt — never in plain text, never hardcoded in the code, and
> never in the browser's localStorage.

Sample coupon: `STORE10` (10% off everything).

## Quick start (local)

```bash
npm install
npm run dev
# open http://localhost:3000
```

On Windows you can also double-click `run-web.bat`.

Local development uses the Cloudflare D1 **local** database (miniflare):
`next.config.mjs` loads the `DB` binding from `wrangler.toml`, and data is
stored under `.wrangler/state`. Load the schema and sample data the first
time with:

```bash
npx wrangler d1 execute fashion-store --local --file=../fashion-store-d1-create.sql
npx wrangler d1 execute fashion-store --local --file=../fashion-store-d1-insert.sql
```

(The SQL files sit next to the project folder.)

For Prisma CLI commands against a local SQLite file instead (e.g.
`npx prisma db push`, `npx prisma generate`, `node prisma/seed.cjs`),
copy `.env.example` to `.env` — it points `DATABASE_URL` at
`database/sqlite/fashion-store.db`. The SQLite file is created on demand;
it is not shipped in this package.

## Deploy to Cloudflare Pages

1. Create a D1 database:
   ```bash
   npx wrangler d1 create fashion-store
   ```
2. Put the returned `database_id` into `wrangler.toml` (it ships with a
   placeholder `00000000-0000-0000-0000-000000000000`).
3. Load the schema and sample data into the real D1 database from the
   Cloudflare dashboard (D1 console) with `fashion-store-d1-create.sql`
   and then `fashion-store-d1-insert.sql`.
4. Connect the repo to a Cloudflare Pages project and set:
   - **Build command:** `npm run pages:build`
   - **Build output directory:** `.vercel/output/static`
5. `npm run pages:build` runs `vercel build` first, which needs a
   `.vercel/project.json` file. Create it with exactly this content
   (the `.vercel` folder is git-ignored):
   ```json
   {"projectId":"_","orgId":"_","settings":{"framework":"nextjs"}}
   ```

## Authentication (server-side)

Accounts live in the `users` table of D1 (or SQLite locally), sessions in
the `sessions` table. Login checks the email + password on the server
(SHA-256 hash with a per-user salt, constant-time comparison) and issues
an HTTP-only, SameSite=Lax cookie — `fashion_session` for the shop,
`admin_session` for `/admin`, so the two areas never share a session.
A session lasts 7 days when "remember me" is checked (always for admin),
otherwise 24 hours. Changing a password deletes the account's other
sessions; resetting the admin password deletes all of them.

Roles: `customer` (shop only), `admin` (full admin), and staff roles
`kho`, `cskh`, `bientap` (see `src/lib/roles.ts`). The shop login
rejects staff/admin accounts and the admin login rejects customers —
both checks run on the server in `/api/auth/login`. Staff management
(`createStaff`, `updateStaff`, `deleteStaff`, customer list/delete) is
protected by `/api/auth/staff` and `/api/auth/customers`: only a logged-in
admin can use them, only an admin may change the admin phone number, and
the root admin account (`admin@store.local`) cannot be demoted or deleted.

If you are upgrading a database created with the older template version,
apply the new schema before redeploying (the old `users` table has no
`salt` column and there is no `sessions` table yet):

```sql
ALTER TABLE users ADD COLUMN salt TEXT NOT NULL DEFAULT '';
CREATE TABLE sessions (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  scope TEXT NOT NULL DEFAULT 'shop',
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX sessions_user_id_idx ON sessions(user_id);
CREATE INDEX sessions_expires_at_idx ON sessions(expires_at);
```

Then re-run `fashion-store-d1-insert.sql` (or re-seed) so the demo
accounts get their new salted hashes and the admin row is created.

Note: there is no "forgot password" reset flow for admin accounts —
the unauthenticated reset endpoint was removed entirely. If an admin
forgets their password, change it directly in the database (generate a
new salt + hash with `node scripts/hash-password.cjs <new-password>` and
UPDATE the users row), or reset it from another logged-in admin account
in /admin/staff. While logged in, an admin changes their own password
in Settings (change-password, which requires the current password).

## Payments

Checkout accepts COD and bank transfer (as before), plus two online
gateways. All of them run in **sandbox / test mode** until you paste
real keys — with no keys configured, the shop runs in **simulation mode**:
the customer is sent to a test page ("Thanh toán thử nghiệm — giả lập")
and can click "thành công" to mark the order paid without any real money
moving. Set `PAYMENTS_SIMULATION=false` and paste real keys to go live.

| Gateway | Currency | How it works |
|---|---|---|
| **PayOS** | VND | Creates a payment link (VietQR / ATM / e-wallet). The customer is redirected to the PayOS checkout; PayOS calls back the webhook, which marks the order paid only after verifying the HMAC-SHA256 signature and the amount. |
| **SePay** | VND | No "create payment" API. The shop shows a VietQR code (SePay QR image) with the shop's bank account and the order code as the transfer content. SePay watches the bank account and calls back the webhook when money arrives; the order is marked paid only if the amount covers the order total. The QR page polls the order status every 5 seconds. |

### Setup (sandbox)

1. **PayOS** — sign up at https://payos.vn, create a sandbox merchant,
   copy Client ID, API Key and Checksum Key.
2. **SePay** — sign up at https://sepay.vn, connect your bank account,
   copy the API key from Dashboard → Tài khoản → API. Set
   `SEPAY_BANK_CODE` (e.g. `VCB` for Vietcombank), `SEPAY_ACCOUNT_NUMBER`
   and `SEPAY_ACCOUNT_NAME`. Register the webhook URL below in the SePay
   dashboard so SePay can report incoming transfers.

### Where to paste the keys

- **Local** (`npm run dev`): copy `.env.example` to `.env.local` and
  fill in the values. The `payments` table must exist in the local D1
  database — run the migration once from the project folder (the SQL
  file sits at the project root, next to
  `fashion-store-d1-create.sql`):
  ```bash
  npx wrangler d1 execute fashion-store --local --file=fashion-store-d1-payments-migration.sql
  ```
- **Live (Cloudflare Pages)**: paste the same variables in the Pages
  project → Settings → Environment variables (production), then run
  `fashion-store-d1-payments-migration.sql` once in the real D1 console.
  Set `NEXT_PUBLIC_SITE_URL` to your public domain (e.g.
  `https://fashion-store-1h4.pages.dev`) so the gateways can redirect
  back to the shop.

### Payment QR codes

When the customer picks a QR-capable method on the checkout page (bank
transfer, MoMo, ZaloPay, PayOS or SePay), a "scan to pay" QR panel appears
in the right column, below the order summary (sofa-site style), beside the
payment methods and outside the method boxes. The order summary sits at
the very top of the right column: one row per purchased item (product
thumbnail, name, size, quantity × unit price, line total), then a
subtotal line, a shipping-fee line ("Free shipping" — the shop charges
no delivery fee; the fee is computed as max(0, total − subtotal), see
`/api/orders`), then the total. If the cart is empty, the order summary
shows an empty message with a button back to the Shop instead. MoMo and ZaloPay are separate methods, each with its own QR and its own
brand colour: Vietcombank/VietQR green, MoMo pink (#a50064), ZaloPay blue
(#008fe5), PayOS green (#00a75a), SePay dark teal (#035a4b). The QR images
live in `public/qr/`: `qr-bank.png` (bank transfer — a valid static
VietQR for the sample account), `qr-momo.png` / `qr-zalopay.png` (sample
placeholders), `qr-payos.png` / `qr-sepay.png` (sample VietQR). Replace
these files with your own bank/wallet QR codes before selling. Note:
PayOS and SePay generate a fresh, real QR code per order after checkout
(on `/checkout/pay`); the static QR in the panel is only a preview.

### Webhook URLs to register

Replace `<domain>` with your public domain:

- PayOS: `https://<domain>/api/payments/payos/webhook`
- SePay: `https://<domain>/api/payments/sepay/webhook`

### How orders flow

- An online payment creates the order with status **"Chờ thanh toán"**
  (awaiting payment). COD / bank transfer / MoMo keep the old status
  **"Chờ xác nhận"**.
- When a gateway confirms the money (webhook, or the return page
  re-checking with the gateway server-side), the order becomes
  **"Đã thanh toán"** (paid). Webhooks are idempotent — a duplicate
  callback does not double-count. The payment itself is stored in the
  `payments` table (gateway, gateway reference, amount, currency,
  status: `pending` / `paid` / `failed` / `simulated`).
- In the admin orders page, the two new statuses appear in the status
  filter and the status dropdown, exactly like the old ones.
- Customers see their own orders at **/account/orders** (linked from
  "Đơn hàng của tôi" on the account page; login required). The page lists
  only the logged-in customer's orders — the server filters by the email
  in the shop session (`GET /api/orders?mine=1`), never by an email the
  browser sends. Each order shows the payment method with a status badge
  right beside it: green **"Đã thanh toán"** once the shop confirms the
  cash was received, amber **"Chờ thanh toán"** while it is still pending.
  After placing a COD / bank / wallet order, the checkout success screen
  also shows the order code, the payment method and the amber
  "Chờ thanh toán" badge, with a link to the orders page.

### Going live

1. For PayOS and SePay, switch the merchant account from sandbox to
   production in their dashboards and replace the keys.
3. Set `PAYMENTS_SIMULATION=false` (or remove the variable).
4. Re-register the webhook URLs above with the live credentials.

## Languages

The shop and the admin panel support **2 languages — English (the
default) and Vietnamese**. A language dropdown sits in the shop
header, in the admin header, and on the admin login screen; it lists
both languages (flag + English name) and has a search box. The
choice is saved in the browser's localStorage (`fashion-lang`) and
kept on the next visit. Currency stays VND and prices, routes, and
the checkout/payment flow are unchanged. (Earlier versions shipped
134 languages; from v16 only English and Vietnamese remain — the
other 132 dictionary files were removed.)

- **How it works:** `src/lib/i18n/` holds the dictionaries.
  Vietnamese + English live in `sections/common.ts`,
  `sections/shop.ts`, `sections/admin.ts` and are bundled with the app
  (`bundled.ts`). The registry of the 2 languages (ISO code, English
  name, native name, text direction, flag) is
  `src/lib/i18n/languages.ts`. `src/context/LanguageContext.tsx`
  provides `useLanguage()` → `{ lang, setLang, t, loading }`;
  components render `t("section.key")`.
- **Fallback:** a missing string in the active language falls back to
  English, then Vietnamese, then the key itself — the page never shows
  a blank label. Run `node scripts/check-i18n.cjs` to verify both
  languages contain the complete key set.
- **RTL:** both shipped languages are left-to-right, so no RTL
  handling is needed; `<html>` still gets `lang` (and `dir="ltr"`)
  set on every language switch.
- **Flags:** each language shows its flag on the switcher button and
  on every dropdown item. Flags are self-contained SVG files in
  `public/flags/` (from flagcdn: `gb.svg` for English, `vn.svg` for
  Vietnamese), rendered by `src/components/FlagIcon.tsx` as plain
  `<img>` — NOT emoji flags, because Chrome on Windows shows flag
  emojis as two-letter codes (e.g. "US") instead of flag images.
  Each entry in `LANGUAGES` has a `flag` field (ISO country code).
  To change a flag, edit the `flag` field and drop the matching SVG
  into `public/flags/`.
- **Product names / descriptions:** the `products` table has `name_en`
  and `description_en` columns (added in v6). English is shown when
  the language is English, falling back to the Vietnamese value when
  empty (`productName()` / `productDescription()` in
  `src/lib/i18n`). The 8 sample products ship with English names and
  descriptions in `fashion-store-d1-insert.sql` and `prisma/seed.cjs`.
- **Emails stay bilingual (VI + EN)** — see "Emails" below.
- **How to add a language back:** add one entry to `LANGUAGES` in
  `src/lib/i18n/languages.ts`, add a dictionary file
  `src/lib/i18n/dictionaries/<code>.ts` with the same keys as the
  English dictionary (copy the structure of the bundled English
  dictionary in `sections/`), add its flag SVG to `public/flags/`,
  then run `node scripts/check-i18n.cjs` to check coverage. (The v7
  dictionaries for 132 languages were removed in v16; they are not
  bundled with this template anymore.)
- **How to change the default:** change `DEFAULT_LANG` in
  `src/lib/i18n/languages.ts` (and the `<html lang="en">` in
  `src/app/layout.tsx`).
- **Upgrading an existing database:** run the migration once (local
  and/or live) so the two new columns exist and the 8 sample products
  get their English text:
  ```bash
  npx wrangler d1 execute fashion-store --local  --file=fashion-store-d1-i18n-migration.sql
  npx wrangler d1 execute fashion-store --remote --file=fashion-store-d1-i18n-migration.sql
  ```

## Emails

Transactional emails are sent through **Resend** (https://resend.com)
using its HTTP API (`POST https://api.resend.com/emails`, plain `fetch`
in `src/lib/email.ts`) — no SMTP and no extra dependency, so it works
on the Cloudflare Edge Runtime. Every email is bilingual (Vietnamese
and English sections in one message).

| When | To | Subject |
|---|---|---|
| Customer registers (`POST /api/auth/register`) | the new customer's email | Chào mừng bạn đến với Fashion Store! \| Welcome to Fashion Store! |
| A new order is placed (`POST /api/orders`) | admin (`ADMIN_EMAIL`, or the admin account's email) | `[Fashion Store] Đơn hàng mới <code> \| New order <code>` |
| An online payment is verified as paid (webhooks, return-page verify, simulation) | admin | `[Fashion Store] Đã nhận thanh toán <code> \| Payment received <code>` |

- **No keys = no mail, no breakage.** With `RESEND_API_KEY` unset,
  sending is skipped silently (logged only). A failed send never fails
  a registration, an order, or a payment confirmation — every send is
  wrapped in try/catch and runs in the background (`waitUntil` on
  Pages, fire-and-forget locally).
- **No duplicates.** The payment email is sent from `markOrderPaid()`
  (`src/lib/payments/common.ts`), which only fires on the first
  transition to paid — a duplicate webhook or a second verification
  does not send again. Simulated payments still send the mail, but the
  subject and body say "(giả lập / simulated)" so the admin does not
  mistake it for real money.
- **Setup (Resend):** create an account at https://resend.com, create
  an API key at https://resend.com/api-keys, and verify your sending
  domain at https://resend.com/domains (until the domain is verified,
  Resend only delivers to the Resend account owner's own email).
  Then set:
  - `RESEND_API_KEY` — the API key.
  - `EMAIL_FROM` — sender address, e.g. `Fashion Store <hello@your-domain.com>`.
  - `ADMIN_EMAIL` — where order/payment notifications go (a real
    mailbox; if empty, the shop uses the admin account's email from
    the database, default `admin@store.local`).
- **Where to paste the keys:** locally, copy `.env.example` to
  `.env.local`; live, paste them in the Cloudflare Pages project →
  Settings → Environment variables (production). Never commit real
  keys.

## Project structure

- `src/app/` — shop pages (`page.tsx`, `shop`, `product/[slug]`,
  `checkout`, `account`, `blog`, `about`, `contact`) and the admin area
  under `src/app/admin/`
- `src/app/api/` — REST routes for products, orders, categories, posts,
  messages, subscribers, coupons, and `auth/` (register, login, logout,
  me, change-password, staff, customers)
- `src/components/` — `Header`, `Hero`, `ProductCard`, `CategoryGrid`,
  `BlogSection`, `Footer`, `CartDrawer`, `admin/` components
- `src/context/` — `AuthContext` (shop accounts), `AdminAuthContext`
  (admin login), `CartContext`, `LanguageContext` (VI/EN toggle)
- `src/lib/` — `store.ts` (API lists), `prisma.ts`, `auth.ts`
  (server-side auth: password hashing, sessions, cookies), `activity.ts`
  (admin activity log), `coupons.ts`, `roles.ts`, `email.ts` (Resend
  transactional emails), `i18n/` (dictionaries + `t()` helper)
- `scripts/hash-password.cjs` — generate a salt + SHA-256 hash for a
  password (used to seed demo accounts in the SQL files)
- `prisma/schema.prisma` — database schema (SQLite / D1)
- `prisma/seed.cjs` — sample data seeder for SQLite
- `database/` — standalone SQL schemas / seeds for MySQL, PostgreSQL,
  and SQLite
- `fashion-store-d1-create.sql` / `fashion-store-d1-insert.sql` — D1
  schema and sample data (8 sample products)
- `public/images/` — sample photos (products, banners, blog posts, about)

## Rebranding

- **Store name** ("Fashion Store" / "FASHION STORE"): `src/app/layout.tsx`
  (page metadata), `src/components/Header.tsx`,
  `src/components/Footer.tsx`, `src/app/admin/orders/page.tsx`
  (`SHOP_NAME`), plus alt texts and messages across `src/app/`.
- **Phone number** (`0123456789`, placeholder): `src/components/Footer.tsx`,
  `src/app/contact/page.tsx`, `src/app/admin/orders/page.tsx`
  (`SHOP_PHONE`), `src/app/admin/settings/page.tsx`, and the admin seed
  phone in `fashion-store-d1-insert.sql` and `prisma/seed.cjs`. The footer
  / contact hotline is a hardcoded string and does not update
  automatically from the admin phone setting.
- **Contact email** (`info@fashionstore.global`): `src/components/Footer.tsx`,
  `src/app/contact/page.tsx`, `src/app/admin/orders/page.tsx`
  (`SHOP_EMAIL`).
- **Demo accounts**: seeded in `fashion-store-d1-insert.sql` (and
  `prisma/seed.cjs`) as rows in the `users` table with hashed passwords.
  To change a demo password, generate a new hash with
  `node scripts/hash-password.cjs <mat-khau-moi>` and update the row.
- **LocalStorage keys**: `fashion-cart`, `fashion-coupons`,
  `fashion-activity-log`, `fashion-admin-avatar`, `fashion-lang`
  (saved language, `vi` or `en`) (see `src/context/*`,
  `src/lib/*`). Sessions are HTTP-only cookies (`fashion_session` for
  the shop, `admin_session` for `/admin`) — no account data is stored
  in localStorage.
- **D1 database name**: `wrangler.toml` (`name`, `database_name`).
- **Package name**: `package.json` (`fashion-store-nextjs`).
- **Shop address** (`123 Đường Lê Lợi, Quận 1, TP. Hồ Chí Minh`,
  placeholder): `src/app/admin/orders/page.tsx` (`SHOP_ADDRESS`),
  `src/app/contact/page.tsx` (address + map), `src/components/Footer.tsx`.
- **Sample content**: the About page team members and the weekend guide
  (`src/app/cuoi-tuan/`) are placeholders — replace them with your own
  team and content.

## Notes

- `next.config.mjs` sets `images: { unoptimized: true }` because
  Cloudflare Pages does not run the Next.js image optimizer.
- The shop refetches its lists whenever the browser tab regains focus,
  so edits made in `/admin` show up in an already-open shop tab.
- Sample images are placeholders — replace them with your own product
  photos before going live.
