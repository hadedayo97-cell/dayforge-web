# Supabase migrations

Run these in the Supabase SQL Editor (Dashboard → SQL) in numeric order.

| File | Purpose |
|------|---------|
| `001_dayforge_schema.sql` | Tables, indexes, profile-on-signup trigger |
| `002_rls_policies.sql` | Row Level Security for all tables |
| `003_copilot_extensions.sql` | Milestones table, task `order_index` + `recurring_rule` (from Copilot plan) |

Both files are idempotent (`IF NOT EXISTS`, `DROP POLICY IF EXISTS`) — safe to re-run on a partial setup.

After running, enable Realtime replication for `tasks`, `goals`, and `notifications` if you want live dashboard updates.
