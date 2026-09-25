# WHL Motocare Supplies

Motorcycle spare parts sales and repair bookings for **WHL Motocare Supplies**, Ndirande Ma Plot (next to COSYS), Blantyre, Malawi.

Phone: **0884 985 461** · **0993 38 39 16**

## What the website does

**For customers**
- Switch between light and dark mode, or let the site follow the phone's own setting
- Browse spare parts by category, motorcycle make, price and search term
- Add parts to a bag and submit an order request for shop collection or local delivery
- Book a repair by choosing a service, motorcycle make, preferred date and time
- Track an order or repair using its reference number and phone number

**For the shop owner**
- Private admin area at `/admin` to manage the catalogue
- Add products, set prices in Malawi kwacha, upload photos
- Publish, hide, feature or delete products
- Changes appear in the storefront immediately

Prices shown are indicative. No payment is taken online — the shop confirms availability, fitment and the final total by phone before payment.

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Database | PostgreSQL via Drizzle ORM |
| Styling | Hand-written CSS with Tailwind's preflight |
| Images | `sharp` (uploads re-encoded to WebP, stored in PostgreSQL) |
| Tests | Playwright (Chromium) |

## Getting started

```bash
npm install
cp .env.example .env          # then set DATABASE_URL
npm run bootstrap             # schema + starter catalogue + private admin key
npm run dev
```

`npm run bootstrap` is safe to run repeatedly. It only applies missing schema changes, seeds the starter catalogue when the catalogue is empty, and generates `ADMIN_SETUP_KEY` when one is missing. It never overwrites existing products, orders, bookings, admin accounts or keys.

On first run it prints a **private owner setup path** (`/admin#setup=…`). Open it once to create the owner account, then keep it private. There is no public sign-up and no default password.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build and server |
| `npm run bootstrap` | Restore schema, catalogue and admin key (idempotent) |
| `npm run db:push` | Apply schema changes only |
| `npm run verify` | Lint, route typegen, TypeScript and production build |
| `npm test` | All Playwright suites |
| `npm run test:shop` | Storefront: ordering, bookings, tracking, mobile |
| `npm run test:refresh` | Cart sync, filter persistence, storage failures |
| `npm run test:theme` | Dark mode switching, persistence and device coverage |
| `npm run test:proxy` | Proxy header handling and cookie security |
| `npm run test:admin` | Admin auth, catalogue management, security |

Tests need the app running and Chromium installed (`npx playwright install --with-deps chromium`). They create temporary records and delete only their own data.

`test:admin` takes a few minutes: it exercises real sign-ins, and password hashing is deliberately slow (scrypt, N=32768). A long run is expected, not a hang.

## Project layout

```
src/app/            Routes: storefront, /shop, /admin, API handlers
src/components/     Storefront UI and admin UI
src/hooks/          Cart store and URL-backed shop filters
src/lib/            Catalogue data, validation, admin auth and helpers
src/db/             Drizzle schema and connection
scripts/            Bootstrap and Playwright test suites
public/images/      Bike and part photography
```

## Security notes

- Passwords hashed with scrypt; session tokens hashed in the database and sent only in `HttpOnly`, `SameSite=Strict` cookies
- Every admin mutation is authorised server-side and origin-checked
- Setup and login attempts are rate limited
- Uploads are size-limited, format-verified and re-encoded; SVG and animated files are rejected
- Prices and totals are always recalculated server-side from the database, never trusted from the browser
- `/admin` is `noindex` and cannot be framed

## Brand assets

### Adding the logo

The site loads the logo from **one file**:

```
public/images/logo.png
```

Drop the badge artwork there and it appears in the header, the footer and the
admin workspace automatically. No code changes are needed.

```bash
cp /path/to/your-logo.png public/images/logo.png
npm run build && npm start        # locally
# or: git add, commit and push — Vercel rebuilds on its own
```

**A rebuild is required.** Files in `public/` are collected when the app is
built, so a production server started before the file existed will keep
returning 404 for it until you rebuild.

Notes on the file:

- **PNG with a transparent background** is ideal. A white background also works.
- **Square** suits the badge best; any aspect ratio is scaled to fit by height.
- Roughly **512–1500px** square is plenty. Larger just costs download size.
- On dark surfaces (footer, admin sidebar, dark mode) the logo sits on a light
  rounded plate, so it stays legible whichever background the file has.

While no file is present, a mark drawn in code is shown instead — the site
never displays a broken image. See `src/components/brand-mark.tsx`.

### Other brand touchpoints

| Asset | File | Notes |
| --- | --- | --- |
| Favicon / tab icon | `src/app/icon.svg` | Deliberately simplified; fine detail is unreadable at 16px |
| Link preview (WhatsApp, Facebook) | `public/images/social-card.jpg` | 1200×630, badge centred on a solid background |

Brand red is defined once as `--brand` in `src/app/globals.css`.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection string. Use a **pooled** string in production. |
| `ADMIN_SETUP_KEY` | Yes | Private one-time key for creating the owner account. |
| `DIRECT_DATABASE_URL` | No | Non-pooled string for schema changes, if your provider needs one. |
| `DATABASE_POOL_MAX` | No | Connections per serverless instance. Defaults to `3`. |

See [.env.example](.env.example).

## Deployment

Built for serverless hosting: the database connection is lazy and pooled per instance, uploads are stored in PostgreSQL rather than on disk, and proxy headers (`X-Forwarded-Host`, `X-Forwarded-Proto`) are honoured for origin and cookie security.

**[DEPLOYMENT.md](DEPLOYMENT.md) has step-by-step Vercel instructions.** In short:

1. Push to Git and import the repository into Vercel.
2. Attach a hosted PostgreSQL database and set `DATABASE_URL` (pooled) plus `ADMIN_SETUP_KEY`.
3. Run `npm run bootstrap -- --print-key` locally against the production database to create the tables.
4. Deploy, then open `/admin#setup=…` once to create the owner account.

Schema changes are never run during a build — you run them deliberately from your own machine.

## Documentation

- [DEPLOYMENT.md](DEPLOYMENT.md) — hosting setup and troubleshooting
- [ADMIN_GUIDE.md](ADMIN_GUIDE.md) — day-to-day catalogue management for the shop owner
