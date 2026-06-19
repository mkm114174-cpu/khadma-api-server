# khadma-api-server

Khadma backend monorepo (Express API + PostgreSQL/Drizzle).

- API: `artifacts/api-server`
- DB schema & migrations: `lib/db`
- Restore data: `database-backup/khadma_db_backup_2026-06-18.sql`

## Run API locally

```bash
pnpm install
pnpm --filter @workspace/api-server run dev
```

Set `DATABASE_URL`, `CLERK_PUBLISHABLE_KEY`, and `CLERK_SECRET_KEY` in `artifacts/api-server/.env`.
