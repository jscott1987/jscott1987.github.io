# PuppyDiscovery production setup

The application bundle is built from `puppydiscovery-test/` and published to the isolated `puppydiscovery-production` branch after QA passes.

## Required production services

### 1. PostgreSQL
Create a PostgreSQL database (Neon, Vercel Postgres, Supabase Postgres, or equivalent) and run:

`server/migrations/001_init.sql`

Then set `DATABASE_URL`.

The API requires:
- `pd_events`
- `pd_leads`

### 2. Operations access
Set `OPERATIONS_TOKEN` to a long random secret. The private Operations page sends it as a Bearer token to `/api/ops-summary`.

### 3. Lead email delivery
Set:
- `RESEND_API_KEY`
- `LEAD_EMAIL_TO`
- `LEAD_EMAIL_FROM`

If Resend is not configured, leads can still be stored in PostgreSQL but email delivery will be skipped.

### 4. Domain
Production canonical URLs, sitemap URLs, and structured data are already set to:

`https://puppydiscovery.com/`

Do not point the domain at the staging GitHub Pages path.

### 5. Vercel
The production bundle contains:
- static site pages
- `/api/events`
- `/api/leads`
- `/api/ops-summary`
- `vercel.json`
- `package.json`

Vercel environment variables must be configured for Production before launch.

## Required pre-launch validation

1. `GET /operations/` has `X-Robots-Tag: noindex, nofollow`.
2. Submit a test lead and confirm:
   - 201 from `/api/leads`
   - database row exists
   - email arrives when Resend is configured
3. Trigger a page view and phone click and confirm rows in `pd_events`.
4. Confirm `/sitemap-index.xml` and `/sitemap-puppies.xml` return 200.
5. Confirm every production page uses the PuppyDiscovery.com canonical.
6. Verify PuppyDiscovery.com in Google Search Console and submit `/sitemap-index.xml`.

## Current staging behavior
The GitHub Pages preview intentionally retains `noindex`. The production build removes preview-only noindex tags.
