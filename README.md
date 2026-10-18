# DZ Prime Academy

An online academy platform for Algerian students, teachers and campus ambassadors: courses and live sessions, a national exam bank, a community feed, and a digital membership card that can be verified from a QR code. The interface is trilingual (Arabic, French, English) and right-to-left aware. Production: <https://www.dzprimeacademy.live>.

## What is in it

| Area | Who | What they do |
| --- | --- | --- |
| Public site | Visitors | Landing page, course and teacher showcase, pricing, card verification page, public profiles |
| Student | Free and paid students | Dashboard, course catalogue, exam bank, live sessions, community, membership card, leaderboard |
| Teacher | Verified teachers | Studio for courses and modules, live sessions, roster, posts, public teacher card |
| Ambassador | Campus ambassadors | Announcements, network, referral and promo code, profile |
| Admin | Owner, admins, moderators | Operations queue, finance, students, teachers, ambassadors, staff, courses, sessions, offers, site footer and settings |

Access is role based (`OWNER`, `ADMIN`, `MODERATOR`, `TEACHER`, `AMBASSADOR`, `STUDENT_PAID`, `STUDENT_FREE`). Admin staff are further limited by a permission map (`frontend/src/lib/rbac.ts`).

### Membership cards

* Card numbers look like `DZ-FND-16-0001`: type, wilaya code, then a running number. They come from an atomic counter table, and a database trigger refuses any later change.
* Types: `FND` founder, `GEN` general admin, `COM` commercial, `HRM` human resources, `FIN` finance, `ADM` other staff, `TCH` teacher, `AMB` ambassador, `STU` student, `GLD` gold member.
* The number is for display only. QR codes, `/verify/<token>` and `/profile/<token>` use a separate random 32-character public token, so cards cannot be listed by counting. Lookups are also rate limited.

## Stack

Next.js 15 (App Router) and React 19, TypeScript, Tailwind CSS, Prisma 6 on PostgreSQL (Supabase), Supabase Storage for uploads, JWT cookie sessions with bcrypt password hashes, Resend or Gmail SMTP for email, Zustand for client state, Phosphor icons.

```
frontend/
  src/app/[locale]/      pages (ar, fr, en) and the role areas
  src/app/api/           route handlers (REST)
  src/components/        admin-v2, student-v2, teacher-v2, ambassador-v2, landing-v2, shared-v2
  src/lib/               auth, rbac, rate limiting, card ids, i18n, email
  prisma/schema.prisma   data model
  prisma/manual-migrations/   SQL rules and one-off migrations (see below)
  tests/probes/          HTTP regression suites
```

## Run it locally

Requirements: Node 20 or newer and a PostgreSQL database.

```bash
cd frontend
cp .env.example .env.local      # fill in the values
npm install
npx prisma db push              # create the tables
npm run db:seed                 # wilayas, institutions, modules, exams, starter bundles
npm run dev                     # http://localhost:3000
```

Environment variables (see `frontend/.env.example`):

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL`, `DIRECT_URL` | PostgreSQL connection (pooled and direct) |
| `JWT_SECRET` | Signs login cookies; use a long random value |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Optional: `npm run db:seed` creates the owner account from these (password change forced at first login) |
| `NEXT_PUBLIC_APP_URL` | Public base URL used in emails and links |
| `RESEND_API_KEY`, `EMAIL_FROM` or `GMAIL_USER`, `GMAIL_APP_PASSWORD` | Email delivery |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Storage for uploads (server only) |

No account is created unless `ADMIN_EMAIL` and `ADMIN_PASSWORD` are set. There are no default credentials in the source.

## Database

`prisma db push` creates the tables. The rules that Prisma cannot express (money checks, unique promo codes, storage buckets, card-number lock) are plain SQL in `frontend/prisma/manual-migrations/phaseN/`. Each step has a rollback file next to it, and the header of each file says when to run it. Run them in the Supabase SQL editor after a backup.

## Quality checks

```bash
npm run typecheck
npm run lint
npm run build
npm run test:probes     # needs a running dev server and a throwaway local database
```

The probe suites (`frontend/tests/probes`) make real HTTP calls as every role and cover privilege escalation, public data leaks, pricing and money rules, uploads, sign-in lifecycle, hardening and the card system. They refuse to run against any database that is not on localhost. See `frontend/tests/probes/README.md`. GitHub Actions runs typecheck, build and the probes on every push.

## Security notes

* Every API route checks the caller's role; staff actions check a permission, not just a role.
* Passwords are hashed with bcrypt; password and token changes invalidate older sessions.
* Login, registration, activation, password reset, posting and card lookups are rate limited.
* Uploads go through signed URLs and a strict host allow-list for images.
* Public endpoints never return email, phone or payment details.
* Secrets live only in environment variables.

## Deployment

The app deploys to Vercel from the `main` branch. A `Dockerfile` for a container build is in `frontend/`.
