# Deploying Schedulemode to schedulemode.com

The app is a Next.js 16 app with a Prisma/PostgreSQL database and an
email/password auth system. Below is the fastest path to production:
**Vercel** (hosting) + **Neon** (Postgres) + **GoDaddy** (your domain DNS).

Everything in the codebase is already prepared — you only need to create the
accounts and paste a few values.

---

## 1. Create the database (Vercel Postgres) · ~2 min

You're using Vercel Postgres (Neon-backed), so the DB lives next to the app:

1. In your Vercel project: **Storage → Create Database → Postgres**, pick the EU
   region (e.g. Frankfurt), and connect it to the project.
2. Vercel auto-injects the connection env vars, including:
   - `DATABASE_URL` (pooled) — used at runtime ✔ already wired
   - `DATABASE_URL_UNPOOLED` (direct) — needed for schema push
3. Add **one** env var manually (Settings → Environment Variables, Production):
   - `DIRECT_URL` = the value of `DATABASE_URL_UNPOOLED`

> Prefer an external DB? Neon (neon.tech) works identically: copy its **pooled**
> URL into `DATABASE_URL` and **direct** URL into `DIRECT_URL`.

## 2. Set the app env vars

Add these (Production) alongside the DB vars above:

| Name                  | Value                        |
|-----------------------|------------------------------|
| `NEXT_PUBLIC_APP_URL` | `https://schedulemode.com`   |
| `PUBLIC_BASE_URL`     | `https://schedulemode.com`   |

(Optional, add later: `ANTHROPIC_API_KEY`, `GOOGLE_*` / `MS_*` for live calendar
sync, `RESEND_API_KEY` for client emails. Without them the app uses safe
fallbacks/mocks.)

## 3. Deploy

`main` is the production branch. Every push to `main` deploys automatically.
The build runs `prisma generate && prisma db push && next build` (see
`vercel.json`), so **the database tables are created automatically on the first
deploy** — no manual migration step. Trigger a deploy (push, or Vercel →
Deployments → Redeploy) once the env vars above are set.

> Note: the build creates tables but does **not** seed demo data — production
> starts clean, and real salons are created through signup. To load the demo
> "Pearly" data into a database, run `npm run db:seed` locally against it.

## 4. Point schedulemode.com at Vercel (GoDaddy) · ~10 min + DNS propagation

1. In Vercel: **Project → Settings → Domains → Add** `schedulemode.com`
   (and `www.schedulemode.com`). Vercel shows the DNS records to set.
2. In GoDaddy: **My Products → Domain → DNS → Manage DNS**, then set what Vercel
   asked for — typically:
   - **A** record: `@` → `76.76.21.21`
   - **CNAME** record: `www` → `cname.vercel-dns.com`
   (Use the exact values Vercel displays; they occasionally change.)
3. Back in Vercel, wait for the domain to verify (a few minutes to a couple of
   hours for DNS to propagate). Vercel issues the HTTPS certificate
   automatically.

## 5. Email (info@schedulemode.com)

- The site already links `info@schedulemode.com` in the footer.
- To **send** transactional email from the app (client emails), add a
  `RESEND_API_KEY` and verify the `schedulemode.com` domain in Resend, then set
  `RESEND_FROM_EMAIL=info@schedulemode.com`.
- To **receive** mail at that address, set up a mailbox/forwarding with your
  email provider (GoDaddy Email, Google Workspace, etc.) — independent of the
  app.

---

## Notes

- **Local development** now uses Postgres too. Quickest local DB:
  `docker compose up -d` then use the `localhost` URL from `.env.example` and
  run `npm run db:setup`. Or just point your local `.env` at a free Neon dev
  branch.
- **Auth/sessions** are self-contained (scrypt + DB-backed cookie sessions) — no
  third-party auth service required to go live.
- **Calendar sync** runs against a mock provider until you add real
  Google/Microsoft/Apple credentials; the rest of the app is fully functional
  without them.
