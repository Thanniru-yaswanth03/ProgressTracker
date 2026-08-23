# Progress Tracker — Architecture & Database Design

No implementation yet — this is the blueprint we'll build from.

---

## 1. Folder Structure

The core principle: **UI components never talk to Mongoose or the database directly.** Everything goes through a service layer. This satisfies rule #7 (business logic separate from UI) and rule #12 (no duplicated logic) — every feature calls the same services whether it's invoked from a Server Component, a Server Action, or a Route Handler.

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx              # auth guard + shared shell
│   │   ├── page.tsx                # overview/dashboard
│   │   ├── sections/page.tsx
│   │   ├── tasks/page.tsx
│   │   ├── habits/page.tsx
│   │   ├── goals/page.tsx
│   │   ├── history/page.tsx
│   │   └── analytics/page.tsx
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts
│   │   ├── sections/route.ts
│   │   ├── tasks/route.ts
│   │   ├── habits/route.ts
│   │   ├── habits/[id]/logs/route.ts
│   │   ├── goals/route.ts
│   │   └── analytics/route.ts
│   └── layout.tsx
│
├── components/
│   ├── ui/                         # shadcn primitives (unmodified)
│   └── features/                   # composed, feature-specific UI
│       ├── sections/
│       ├── tasks/
│       ├── habits/
│       ├── goals/
│       └── analytics/
│
├── server/                         # BUSINESS LOGIC — the only layer that touches Mongoose
│   ├── auth/
│   │   ├── auth.config.ts
│   │   ├── session.ts              # getCurrentUser(), requireUser()
│   │   └── password.ts             # hash/verify (bcrypt)
│   ├── services/
│   │   ├── section.service.ts
│   │   ├── task.service.ts
│   │   ├── habit.service.ts
│   │   ├── streak.service.ts       # pure streak math, unit-testable
│   │   ├── goal.service.ts
│   │   ├── activity.service.ts
│   │   └── analytics.service.ts
│   └── actions/                    # Server Actions — thin wrappers around services
│       ├── section.actions.ts
│       ├── task.actions.ts
│       ├── habit.actions.ts
│       └── goal.actions.ts
│
├── models/                         # Mongoose schemas — one file per collection
│   ├── User.ts
│   ├── Section.ts
│   ├── Task.ts
│   ├── Activity.ts
│   ├── Habit.ts
│   ├── HabitLog.ts
│   └── Goal.ts
│
├── lib/
│   ├── db.ts                       # cached Mongoose connection singleton
│   ├── utils.ts                    # shadcn's cn() etc.
│   └── errors.ts                   # shared AppError / NotFoundError / ForbiddenError
│
└── types/
    └── index.ts                    # shared TS types/DTOs (not raw Mongoose docs)
```

**Why Server Actions live in a separate folder from services:** the service functions contain the actual logic and are plain, testable TypeScript (no `"use server"`, no framework coupling). The action files are thin — they call `requireUser()`, call the service, and `revalidatePath`. This means the same service can later be reused by a Route Handler, a cron job, or a test, without touching the action layer.

---

## 2. Database Collections

All collections use MongoDB ObjectIds and every user-owned collection carries a `userId` field indexed for fast, secure scoping.

### `users`
```
_id
email          (unique, lowercase, indexed)
passwordHash   (bcrypt — never plaintext)
name
createdAt
updatedAt
```

### `sections`
User-defined groupings (e.g. "Fitness", "Work", "Reading"). Tasks and habits optionally belong to a section.
```
_id
userId         (indexed)
name
color          (optional, for UI)
order          (for custom sort)
createdAt
updatedAt
```

### `tasks`
One-off or recurring to-dos, not habit-tracked (no streaks).
```
_id
userId         (indexed)
sectionId      (optional, ref Section)
title
description
status         ('pending' | 'completed')
dueDate        (optional)
completedAt    (optional)
createdAt
updatedAt
```

### `activities`
The append-only log of "things the user did" — completing a task creates an activity record; this is what powers the Activity History view and feeds analytics. Kept separate from `tasks` so history remains intact even if a task is later edited or deleted.
```
_id
userId         (indexed)
type           ('task_completed' | 'habit_completed')
refId          (Task._id or Habit._id)
sectionId      (denormalized, for fast filtering)
title          (denormalized snapshot, so history reads correctly even if source is renamed)
occurredAt     (indexed — the date the activity counts toward)
createdAt
```

### `habits`
The habit definition plus **cached** streak fields (see §7 for why).
```
_id
userId         (indexed)
sectionId      (optional)
name
frequency      ({ type: 'daily' } | { type: 'weekly', daysOfWeek: number[] } | { type: 'x_per_week', count: number })
currentStreak  (cached int, default 0)
longestStreak  (cached int, default 0)
lastCompletedDate (cached, ISO date string, day-granularity)
createdAt
updatedAt
```

### `habitLogs`
One document per day a habit was marked complete. This is the source of truth streaks are computed from; the cached fields on `habits` are a derived optimization, never authoritative on their own.
```
_id
userId         (indexed)
habitId        (indexed, ref Habit)
date           (ISO date string, day-granularity — e.g. "2026-08-23", NOT a full timestamp)
completedAt    (actual timestamp, for display/analytics)
```
Unique compound index on `(habitId, date)` — this is what prevents duplicate completions for the same day at the database level, not just in application logic.

### `goals`
```
_id
userId         (indexed)
title
description
targetType     ('habit_streak' | 'task_count' | 'custom')
linkedHabitId  (optional, ref Habit)
targetValue    (e.g. streak length or count)
currentValue   (denormalized progress snapshot; recalculated by the service, not hand-edited)
deadline       (optional)
status         ('active' | 'completed' | 'abandoned')
createdAt
updatedAt
```

### Relationships summary
```
User 1───* Section
User 1───* Task ──── (optional) Section
User 1───* Habit ─── (optional) Section
User 1───* HabitLog ──── Habit   (unique per habitId+date)
User 1───* Activity ──── Task | Habit  (polymorphic via type + refId)
User 1───* Goal ──── (optional) Habit
```

Every child collection carries `userId` directly (rather than relying on joining through the parent) — this is deliberate, so every query can be scoped and secured in one predicate without an extra lookup. This is what makes rule #6 enforceable cheaply and consistently.

---

## 3. Authentication Flow

**Approach: Auth.js (NextAuth) v5 with the Credentials provider, JWT session strategy, bcrypt password hashing.**

Rule #9 says avoid unnecessary dependencies — but hand-rolling session cookies, CSRF protection, and JWT rotation is exactly the kind of security-critical code that's worth a well-audited library rather than custom logic. `bcryptjs` (or `bcrypt`) for hashing is similarly justified. No other auth-related dependency is needed.

**Registration:**
1. Client submits email + password to a Server Action.
2. Service validates input (zod schema), checks email uniqueness.
3. Password hashed with bcrypt (cost factor 12) — plaintext never touches the database (rule #4).
4. `User` document created; no session issued automatically — redirect to login (or auto-sign-in via Auth.js, your call at implementation time).

**Login:**
1. Credentials provider's `authorize()` looks up user by email, compares hash with `bcrypt.compare`.
2. On success, Auth.js issues a signed, `httpOnly`, `secure` JWT session cookie. **No tokens or user data ever go into `localStorage`** (rule #2) — this is enforced structurally by using Auth.js's cookie-based sessions rather than a client-managed token.
3. Session payload contains only `userId` and `email` — never the password hash.

**Session access on the server:**
- `server/auth/session.ts` exports `getCurrentUser()` (returns user or null) and `requireUser()` (returns user or throws/redirects). Every Server Action, Route Handler, and protected Server Component calls one of these — never reads cookies manually. This is the single choke point for rule #5 and #6.

**Route protection:**
- `middleware.ts` guards the `(dashboard)` route group, redirecting unauthenticated requests to `/login`.
- Defense in depth: even though middleware blocks page access, every Server Action/API route independently calls `requireUser()` too, since middleware alone isn't sufficient for data-layer security.

**No demo/seed users in production code paths** (rule #3) — if seed data is useful for local dev, it lives in a separate script gated behind `NODE_ENV !== 'production'`, never in application logic.

---

## 4. API Structure

Two ways to reach the service layer, used for different purposes:

- **Server Actions** (`server/actions/*`) — used for all mutations triggered from the UI (create task, complete habit, etc.). Colocated with forms, progressively enhanced, no manual `fetch` needed.
- **Route Handlers** (`app/api/**/route.ts`) — used where a real HTTP endpoint is needed: the Auth.js catch-all, and the analytics endpoint (so it can be fetched client-side by chart components that want to refetch on filter change without a full server round-trip).

Every handler/action follows the same shape:
```ts
export async function completeHabit(habitId: string, date: string) {
  const user = await requireUser();                 // 1. auth
  const habit = await habitService.getOwned(habitId, user.id); // 2. ownership check
  if (!habit) throw new NotFoundError();             // 3. never leak existence of others' data
  const result = await habitService.logCompletion(habit, date, user.id);
  revalidatePath('/habits');
  return result;
}
```
The ownership check always happens **inside the query itself** (`Habit.findOne({ _id: habitId, userId: user.id })`), not as a separate "fetch then compare userId" step — this avoids a whole class of bugs where the check is accidentally skipped.

---

## 5. State Management Strategy

Given Next.js App Router + Server Components, we deliberately keep client state minimal:

- **Initial data:** fetched server-side in Server Components directly via the service layer (no client fetch waterfall, no loading spinners for first paint).
- **Mutations:** Server Actions + `revalidatePath`/`revalidateTag`. React's `useOptimistic` for instant UI feedback on things like checking off a habit, without needing a global store.
- **Local/UI-only state** (modal open/close, form drafts, filter selections): plain `useState`/`useReducer` in the relevant client component.
- **No Redux/Zustand/React Query.** Nothing in this app's data flow needs client-side caching across route boundaries strongly enough to justify it (rule #9). If analytics filtering later needs client-side refetch-without-reload, a plain `fetch` to the `/api/analytics` route handler with local component state is sufficient.

---

## 6. Streak Calculation

**Two layers, one source of truth:**

1. **Source of truth:** `habitLogs` — one document per completed day.
2. **Cache:** `currentStreak` / `longestStreak` / `lastCompletedDate` stored on the `habits` document, so the UI (habit list, dashboard, analytics) can read streaks without recomputation on every render.

The cache is **write-through**: it's recalculated by `streak.service.ts` every time a `HabitLog` is created or deleted, inside the same service call — never edited directly, and never trusted as authoritative if it ever drifts (a "recompute from logs" utility should exist as an escape hatch).

**Algorithm (`streak.service.ts`, pure functions, easy to unit test):**

- For a **daily** habit: walk backward day-by-day from today. If today has no log yet, start checking from yesterday (an unbroken streak isn't broken just because today hasn't happened yet). Count consecutive days with a log until a gap is found — that count is `currentStreak`.
- For a **weekly (specific days)** habit: only the configured `daysOfWeek` count as "expected" days; gaps on non-expected days don't break the streak. Walk backward over *expected* days only.
- For an **x-per-week** habit: streak is measured in consecutive *weeks* that met the target count, not consecutive days.
- **Longest streak:** scan all logs chronologically once, tracking the longest run under the same adjacency rule as above. This is the only O(n) full-history scan, and it only needs to run on habit creation/backfill or via the recompute utility — not on every completion (incremental completions just compare the new current streak against the cached longest).

All date comparisons use **day-granularity strings** (`"2026-08-23"`), not full timestamps, and should be computed in a single consistent timezone policy decided up front (either UTC or the user's stored timezone preference) — mixing the two is the most common source of off-by-one streak bugs.

---

## 7. Data Ownership & Security Model

- Every user-owned schema has a required, indexed `userId` field.
- **No query ever runs without a `userId` filter**, sourced only from the server-verified session — never from a client-supplied parameter, body field, or URL param (rule #6). A malicious `POST /api/habits/:id/logs` with someone else's habit ID simply won't match any document once `userId` is included in the `findOne`, so it 404s rather than leaking or mutating another user's data.
- A single `getOwned(id, userId)` pattern is reused across every service (rule #12) rather than each service reinventing the ownership check.
- Passwords: bcrypt hash only, never logged, never returned in any API/service response (Mongoose `select: false` on `passwordHash`).
- Mongo connection string, session secret, etc. live in environment variables, never committed or hardcoded.
- Rate limiting on auth routes (login/register) is worth adding at implementation time to slow down credential-stuffing — flagging it now, not building it yet since it's not in your feature list.

---

## 8. Implementation Phases

1. **Foundation** — Next.js/TS/Tailwind/shadcn scaffold, Mongoose connection singleton, `User` model, Auth.js setup (register/login/logout, session utilities, middleware guard). Nothing else until this is solid.
2. **Sections** — full CRUD, since Tasks and Habits both depend on it.
3. **Tasks** — CRUD + completion, writing to `activities` on completion.
4. **Activity History** — read view over the `activities` collection (filter by section/date/type).
5. **Habits (core)** — CRUD for habit definitions, `habitLogs` completion endpoint with the unique-index duplicate guard.
6. **Streak engine** — `streak.service.ts` with unit tests for daily/weekly/x-per-week edge cases, wired into habit completion/uncompletion, cached fields kept in sync.
7. **Goals** — CRUD + progress calculation (reading from tasks/habit streaks depending on `targetType`).
8. **Analytics** — aggregation queries (completions over time, per-section breakdowns, streak trends) exposed via the `/api/analytics` route handler, charted in the UI.
9. **Polish** — loading/empty states, optimistic UI on habit check-off, error boundaries, indexes review.

Each phase should be fully working end-to-end (DB → service → UI) before moving to the next, rather than building all models first and all UI later — that keeps the surface area you're reviewing at any point small and testable.

---

**Next step:** once you confirm this design, I'll start with Phase 1 (foundation + auth) and we build outward from there.
