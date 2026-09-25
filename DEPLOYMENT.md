# Deploying to Vercel

The site is a standard Next.js App Router project, so Vercel detects and builds it with no custom configuration. The only real work is attaching a PostgreSQL database and setting two environment variables.

Budget about 20 minutes for the first deployment.

---

## 1. Push the code to Git

Create a repository on GitHub, GitLab or Bitbucket and push this project to it.

`.gitignore` already excludes `.env`, so your database credentials and admin setup key stay off the internet. Double-check before pushing:

```bash
git status --short          # .env must NOT appear
```

## 2. Create a PostgreSQL database

Vercel's own filesystem is read-only and temporary, so everything — catalogue, product photos, orders, bookings, admin accounts — lives in PostgreSQL. You need a hosted database that persists.

Any provider works. The easiest options integrate directly with Vercel:

| Provider | Notes |
| --- | --- |
| **Neon** | Free tier, installs from the Vercel Marketplace, sets `DATABASE_URL` automatically |
| **Supabase** | Free tier, includes PgBouncer pooling |
| **Vercel Postgres** | Set up inside the Vercel dashboard |

**Use the pooled connection string** for `DATABASE_URL`. Serverless functions open their own connection per instance, so an unpooled database runs out of connections under load. Pooled strings usually contain `-pooler` or `pgbouncer=true`.

Keep `sslmode=require` in the string — hosted providers need TLS.

## 3. Import the project into Vercel

In the Vercel dashboard choose **Add New → Project**, pick your repository and import it. Leave the build settings alone; the defaults are correct:

- Framework: **Next.js**
- Build command: `next build`
- Install command: `npm install`

Don't deploy yet — set the environment variables first.

## 4. Set environment variables

Under **Settings → Environment Variables**, add these for *Production*, *Preview* and *Development*:

| Name | Value |
| --- | --- |
| `DATABASE_URL` | Your pooled PostgreSQL connection string |
| `ADMIN_SETUP_KEY` | A private random key — see below |

Generate the setup key:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

This key is only used once, to create the owner account. Treat it like a password: never commit it, screenshot it or share it publicly.

Optional variables:

| Name | When to use |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Once you attach a custom domain — fixes link previews and the sitemap |
| `DIRECT_DATABASE_URL` | Provider requires a non-pooled string for schema changes |
| `DATABASE_POOL_MAX` | Database has a low connection limit (default is `3`) |

`NEXT_PUBLIC_SITE_URL` falls back to your Vercel domain automatically, so you can add it later. Set it as soon as you have a custom domain, otherwise WhatsApp and Facebook previews will point at the old `.vercel.app` address.

## 5. Create the database tables

Schema changes run from your own machine, not during the Vercel build — a build should never modify a production database.

From the project folder, pointed at your **production** database:

```bash
DATABASE_URL="postgres://…your production string…" \
  npm run bootstrap -- --print-key
```

This will:

1. Create all tables (`products`, `orders`, `bookings`, `admin_accounts`, `admin_sessions`, `admin_rate_limits`, `catalogue_images`)
2. Seed the six starter products **only if the catalogue is empty**
3. Print an `ADMIN_SETUP_KEY` if you haven't set one

It is safe to run again later — it never overwrites existing products, orders, bookings or accounts. Add `--no-seed` to skip the starter catalogue entirely.

If your provider needs a direct connection for migrations:

```bash
DATABASE_URL="…pooled…" DIRECT_DATABASE_URL="…direct…" npm run bootstrap
```

## 6. Deploy

Click **Deploy**. When it finishes, check:

- `https://your-domain/` — homepage loads with bike photos
- `https://your-domain/shop` — six starter products appear
- `https://your-domain/api/health` — returns `{"ok":true}`

If the shop is empty or `/api/health` fails, `DATABASE_URL` is wrong or step 5 hasn't run.

## 7. Create the owner account

Open this once, in a private browser window:

```
https://your-domain/admin#setup=YOUR_ADMIN_SETUP_KEY
```

Fill in your name, email and a password of at least 12 characters. The key stops working the moment the account exists.

From then on, sign in at `https://your-domain/admin`, or via **Admin login** in the site footer.

---

## After going live

**Custom domain.** Add it under **Settings → Domains**. Vercel issues the HTTPS certificate automatically. Session cookies are marked `Secure` as soon as the site is served over HTTPS.

**Region.** Under **Settings → Functions**, pick the region closest to your database — not to your customers — because most requests are database reads. Cape Town (`cpt1`) or Frankfurt (`fra1`) are the usual choices for Malawi. Put the database in the same region if you can.

**Backups.** The database holds the catalogue, product images, orders, bookings and admin accounts. Enable your provider's automatic backups.

**Upload limits.** Product photos are capped at 3 MB, comfortably inside Vercel's 4.5 MB request limit. Uploads are re-encoded to WebP and stored in PostgreSQL, so they survive redeployments.

---

## Troubleshooting

**Shop page is empty** — Step 5 hasn't run against this database, or `DATABASE_URL` points somewhere else.

**"too many connections"** — You're using an unpooled connection string. Switch to the pooled one, or lower `DATABASE_POOL_MAX`.

**"Owner setup is not configured"** — `ADMIN_SETUP_KEY` is missing or shorter than 24 characters. Add it and redeploy so the new value loads.

**"That owner setup key is not valid"** — The key in your URL doesn't match the deployed one. Check for a truncated copy-paste, and confirm you set the variable for the *Production* environment.

**Admin sign-in rejected** — Requests must come from the same domain. If you front the site with another proxy or CDN, make sure it forwards the `Origin`, `X-Forwarded-Host` and `X-Forwarded-Proto` headers.

**Build fails on TypeScript** — Run `npm run verify` locally to see the same errors with full output.

---

## Local development

```bash
npm install
cp .env.example .env     # set DATABASE_URL
npm run bootstrap
npm run dev
```

Before pushing changes:

```bash
npm run verify           # lint, route types, TypeScript, production build
npm test                 # Playwright suites (needs the app running)
```
