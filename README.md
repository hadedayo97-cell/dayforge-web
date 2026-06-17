# DayForge Web

Personal productivity app — translate high-level goals into daily tasks, track progress, and schedule reminders.

## Quick Start

```bash
npm install
cp .env.example .env   # add your Supabase URL + anon key
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

### Environment

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | For production | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | For production | Supabase anon/public key |

Without these, the app falls back to a **localStorage mock** (useful for UI-only development).

## Supabase Database

Run the SQL migrations in [`supabase/migrations/`](supabase/migrations/) via the Supabase SQL Editor (in order):

1. `001_dayforge_schema.sql` — tables, indexes, profile trigger
2. `002_rls_policies.sql` — row-level security

Enable **Google OAuth** and **Realtime** in the Supabase dashboard as needed.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Type-check + production build |
| `npm run preview` | Preview production build |
| `npm run lint` | ESLint |

## Project Docs

- [`PROJECT.md`](PROJECT.md) — architecture, feature status, roadmap
- [`COPILOT_PLAN.md`](COPILOT_PLAN.md) — full plan from the [Copilot chat](https://copilot.microsoft.com/shares/kLqEjZCujsG5tdLLERGAS)

## Stack

- React 19 + TypeScript + Vite
- React Router 7
- Supabase (Auth, Postgres, Realtime)
- lucide-react icons
