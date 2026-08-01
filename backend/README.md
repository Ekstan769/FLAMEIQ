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
# install dev deps first
pnpm install
# run in dev mode (live-reload)
pnpm run dev
```

Build & Run (production)
```bash
pnpm run build
pnpm run start
```

Environment
- Copy `.env.example` to `.env` (if you have one) or create `.env` with `PORT` and other keys.
