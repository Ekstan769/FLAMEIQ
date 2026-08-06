# FLAMEIQ — backend

Development setup and quick commands for the backend.

Prerequisites
- Node.js 18+ and `pnpm` installed.

Install
```bash
pnpm install
```

Run (development)
```bash
pnpm install
pnpm run dev
```

Build & Run (production)
```bash
pnpm run build
pnpm run start
```

Prisma
```bash
pnpm run prisma:generate
pnpm run prisma:db:push
# or
pnpm run prisma:migrate:dev
```

Linting and tests
```bash
pnpm run lint
pnpm run lint:fix
pnpm run typecheck
pnpm run test
```

Environment
- Copy `.env.example` to `.env` and update values.
- Required values:
  - `PORT`
  - `DATABASE_URL`
  - `ENABLE_CRON_JOB`
  - `EMAIL_HOST`
  - `EMAIL_PORT`
  - `EMAIL_USER`
  - `EMAIL_PASS`

Notes
- `ENABLE_CRON_JOB` can be set to `false` locally if you want to disable scheduled prediction jobs.
- `EMAIL_HOST` and `EMAIL_PORT` are used by `nodemailer` in `src/services/emailService.ts`.
