# Deploying Schedulemode to schedulemode.com

The app is a Next.js 16 app with a Prisma/PostgreSQL database and an
email/password auth system. Below is the fastest path to production:
**Vercel** (hosting) + **Neon** (Postgres) + **GoDaddy** (your domain DNS).

Everything in the codebase is already prepared — you only need to create the
accounts and paste a few values.

---

## 1. Create the database (Neon — free tier) · ~3 min

1. Sign up at <https://neon.tech> and create a project (region: EU, e.g.
   Frankfurt, to match `Europe/Amsterdam`).
2. From the project dashboard, copy **two** connection strings:
   - **Pooled** connection → this is your `DATABASE_URL`
   - **Direct** connection → this is your `DIRECT_URL`
   (Neon shows both; the pooled one contains `-pooler`.)

> Any Postgres works (Supabase, Vercel Postgres, RDS). Just provide both URLs;
> if your provider has no separate pooler, set both to the same value.

## 2. Deploy to Vercel · ~5 min

1. Sign up at <https://vercel.com> and **Import** this GitHub repo
   (`dwtgiesen-ship-it/quotodo`). Vercel auto-detects Next.js — no build config
   needed (`postinstall` runs `prisma generate`).
2. Before the first deploy, add **Environment Variables** (Settings →
   Environment Variables), for the **Production** environment:

   | Name                 | Value                                            |
   |----------------------|--------------------------------------------------|
   | `DATABASE_URL`       | Neon **pooled** URL                              |
   | `DIRECT_URL`         | Neon **direct** URL                              |
   | `NEXT_PUBLIC_APP_URL`| `https://schedulemode.com`                       |
   | `PUBLIC_BASE_URL`    | `https://schedulemode.com`                       |

   (Optional, add later: `ANTHROPIC_API_KEY` for the real AI assistant;
   `GOOGLE_*` / `MS_*` for live calendar sync; `RESEND_API_KEY` for client
   emails. Without them the app uses safe fallbacks/mocks.)
3. Click **Deploy**.

## 3. Initialize the database schema · ~1 min

The schema must be pushed to Neon once (and seeded with demo data if you want a
populated demo salon). From your machine, with the Neon URLs in a local `.env`:

```bash
npm install
npm run db:push     # creates all tables in Neon
npm run db:seed     # optional: demo "Pearly" salon + sample data
```

(You can re-run `db:push` any time the schema changes. Production data is safe —
`db push` is additive for these models.)

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
