# Regression probes

Real HTTP checks, one suite per audit phase, against a running dev server and a **throwaway local database**.
They create their own users, courses, posts and money records, log in as each role, and delete everything afterwards.

| Suite | What it protects |
| --- | --- |
| `01-privilege-and-data-leaks` | role escalation, per-role permissions, public data leaks, card lookup, vouchers |
| `02-money` | server-side pricing, atomic approvals, finance numbers, promotions, commissions, database rules |
| `03-images-community-ownership` | signed uploads, image URL rules, database-backed community, private posts, teacher ownership, landing config |
| `04-sign-in-lifecycle` | token versions, lockouts and rate limits, reset and activation links, password policy, seeding |
| `05-hardening` | public settings subset and no write-on-read, session join links, error answers instead of 500s, card expiry, account validation, private exam files, security headers |

## Run locally

```bash
docker run -d --name dzprime-audit-pg -e POSTGRES_PASSWORD=audit -e POSTGRES_DB=audit -p 55432:5432 postgres:16-alpine
cd frontend
export DATABASE_URL=postgresql://postgres:audit@localhost:55432/audit DIRECT_URL=$DATABASE_URL
npx prisma db push && npm run db:seed          # schema + catalog (no accounts are created)
# .env.local (git-ignored) must point the app at the same database and set:
#   JWT_SECRET=<anything>  SUPABASE_URL=http://localhost:54999  SUPABASE_SERVICE_ROLE_KEY=test-service-key
npm run dev                                     # in one terminal
npm run test:probes                             # in another
```

- The probes refuse any database that is not on `localhost` (`guard.cjs`). Never point them at Supabase.
- `03` starts a tiny stand-in for Supabase Storage on port 54999 itself; `SUPABASE_URL` above is what makes the app talk to it.
- Use `next dev`, not `next start`: in production mode the app (correctly) trusts forwarded IP headers only on Vercel
  or with `TRUST_PROXY=1`, and refuses the local `http://` storage stand-in.
- Override with `PROBE_DATABASE_URL` and `PROBE_BASE_URL` if your ports differ.
