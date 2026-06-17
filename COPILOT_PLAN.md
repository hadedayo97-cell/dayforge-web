# DayForge — Copilot Plan (Source of Truth)

> Ingested from [Copilot share link](https://copilot.microsoft.com/shares/kLqEjZCujsG5tdLLERGAS) on 2026-06-17.

## Product

**DayForge** — daily goal-tracking app/website. Tagline: *"Forge better days, one goal at a time."*

Original monetization idea (selling user data) was rejected in the Copilot plan. Recommended models instead:

- Freemium (basic free, premium analytics/coaching)
- Subscriptions
- Marketplace (coaches/consultants)
- Affiliate marketing
- B2B team productivity

## Strategy: Web MVP → Full App

| Phase | Scope |
|-------|--------|
| **Web MVP** (now) | Auth, goals, daily tasks, dashboard analytics, email notifications, data export/delete |
| **Full app** (later) | Push notifications, habit/recurring tasks, social/accountability, AI insights, premium tiers |

## Copilot Tech Stack (agreed)

| Layer | Choice |
|-------|--------|
| Frontend | React + Vite + Tailwind CSS |
| Backend | Supabase (Postgres, Auth, Realtime, Storage, Edge Functions) |
| Email | Postmark or Resend (transactional) |
| Deploy | Vercel |

**Implementation note:** The Antigravity build uses **custom CSS** (glass-panel design) instead of Tailwind. Functionality aligns; styling diverges.

## Web MVP Features (Copilot)

### Must have

- User accounts: email/password + OAuth (Google/Apple)
- Create and manage goals: title, deadline, priority, progress percent
- Daily planner: add tasks, mark complete, **reorder**
- Dashboard: two-column layout (left: Today; right: Goals + progress)
- Basic analytics: streak, weekly activity sparkline
- Email notifications: welcome, password reset, task reminders
- Data export (JSON) and account deletion (with email confirm)

### MVP acceptance criteria

1. New user signs up and creates a goal in under 60 seconds
2. Tasks can be added, **reordered**, and marked complete; progress updates immediately
3. Dashboard responsive on mobile browser
4. User can export data as JSON and request account deletion
5. Analytics events: signup, create goal, complete task, convert to paid

## Data Model (Copilot)

| Table | Columns |
|-------|---------|
| `users` | Handled by Supabase Auth; extended via `profiles` |
| `profiles` | `id`, `full_name`, `birthday`, timestamps |
| `goals` | `id`, `user_id`, `title`, `description`, `deadline`, `priority`, `progress_percent`, `status`, timestamps |
| `tasks` | `id`, `goal_id`, `user_id`, `title`, `due_date`, `completed`, **`order_index`**, **`recurring_rule`**, timestamps |
| `milestones` | `id`, `goal_id`, `title`, `due_date`, `completed` |
| `notifications` | `id`, `user_id`, `type`, `payload`, `send_at`, `sent_at`, `status` |
| `sessions` | Future — device tracking |
| `subscriptions` | Future — freemium/premium |

## Planned Folder Structure (Copilot)

```
src/
├── App.tsx
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx
│   │   └── Header.tsx
│   └── domain/
│       ├── GoalCard.tsx        ← not extracted yet
│       ├── TaskItem.tsx        ← not extracted yet
│       └── NotificationPanel.tsx
├── pages/
│   ├── Landing/Landing.tsx
│   ├── Auth/SignIn.tsx
│   ├── Dashboard/
│   │   ├── Dashboard.tsx
│   │   └── TodayList.tsx
│   ├── Goal/GoalEditorModal.tsx
│   └── Settings/Settings.tsx
└── lib/
    ├── supabaseClient.ts
    └── hooks/useAuth.ts
supabase/
├── migrations/
└── functions/                  ← Edge Functions not yet created
    ├── schedule-reminder/
    └── email-webhook/
```

## Component Spec (Copilot)

| Component | Copilot spec | Current status |
|-----------|--------------|----------------|
| AppShell | Layout, auth guard, routing | Done |
| Header | Brand, quick-add, profile menu | Done (no quick-add) |
| Landing | Marketing + email capture | Done (capture UI-only) |
| SignIn | Email + OAuth | Done (Google only in UI) |
| Dashboard | TodayList + ProgressPanel, analytics | Done (inline goal cards) |
| TodayList | Drag-and-drop, toggle, persist order | Partial (no reorder) |
| GoalEditorModal | Create/edit goal, milestones, tasks | Partial (create only) |
| GoalCard | Summary in right column | Inline in Dashboard |
| TaskItem | Checkbox, due date, recurring indicator | Inline in TodayList |

## Design Tokens (Copilot vs implemented)

| Token | Copilot | Implemented (`index.css`) |
|-------|---------|---------------------------|
| Primary | `#0B6EFD` | `#3b82f6` |
| Accent | `#00C48C` | `#8b5cf6` (purple accent) |
| Radius | 8px | 8px / 12px / 20px scale |
| Spacing | 4, 8, 16, 24, 32 | Ad hoc |

## Notifications Architecture (Copilot)

1. Store scheduled reminders in `notifications` table
2. Supabase Edge Function runs on cron → query `status = scheduled` AND `send_at <= now()`
3. Send via Postmark/Resend with templates: `{{user_name}}`, `{{goal_title}}`, `{{task_title}}`, `{{due_date}}`
4. Edge Function webhook for bounces/complaints
5. Separate marketing vs transactional email streams

## Edge Functions (planned, not in repo)

- `POST /functions/v1/schedule-reminder`
- `POST /functions/v1/email-webhook`

## 3-Week Timeline (Copilot)

| Week | Deliverables |
|------|--------------|
| 1 | Repo scaffold, auth, DB schema, landing page, basic CI |
| 2 | Dashboard, goal CRUD, tasks, responsive layout |
| 3 | Notifications, export/delete, polish, deploy |

## Implementation vs Copilot — Gap Summary

| Copilot item | Status |
|--------------|--------|
| Supabase + Auth | Done |
| Goals create | Done |
| Goals edit/delete | Not done |
| Tasks CRUD | Done |
| Task reorder (`order_index`) | Schema added (`003`); UI not wired |
| Milestones | Schema added (`003`); UI not wired |
| Recurring tasks | Schema column added; UI not wired |
| Real streak + weekly chart | Stub only |
| Email send (Edge Function) | Not done |
| Tailwind CSS | Skipped (custom CSS used) |
| GoalCard / TaskItem components | Not extracted |
| CI/CD | Not set up |
| Vercel deploy | Not configured |
| Apple OAuth | Not in UI |
| Proper account deletion | localStorage clear only |
| Analytics events | Not implemented |

## User Flows (Copilot)

1. **Daily routine:** Dashboard → Today list → mark complete → streak + progress update
2. **Goal lifecycle:** Create goal → add milestones/tasks → update progress → complete → celebration animation
3. **Privacy:** Settings → Export data or Delete account → confirm via email

## Next Build Priority (aligned with Copilot + current gaps)

1. Goal edit/delete in `GoalEditorModal`
2. Task drag-and-drop reorder → persist `order_index`
3. Edge Function: send scheduled notifications via Resend/Postmark
4. Real streak from completed-task history
5. Milestones UI in goal editor
6. Extract `GoalCard.tsx` and `TaskItem.tsx` (optional refactor)
