<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# ProgressTracker Engineering & Agent Operating Guidelines

## 1. Skill Discovery & Selection Protocol
- **MANDATORY**: Before creating or modifying UI components, CSS, or web layouts, check available skills and activate relevant skills such as `modern-web-guidance` or `a11y-debugging`.
- Prioritize native web APIs (e.g. CSS variables, React Portals, CSS containment) and ensure standards compliance across modern browsers.

## 2. Architecture & Tech Stack Rules
- **Stack**: Next.js 16 (App Router), React 19, Tailwind CSS v4, Mongoose / MongoDB, NextAuth v5, Zod.
- **Architecture Preservation**: Preserve existing Server Actions pattern in `src/server/actions/` and service domain logic in `src/server/services/`.
- **No Blind Rewrites**: Do NOT rewrite working backend services or introduce heavy external dependencies when clean React/Tailwind patterns suffice.

## 3. UI/UX & Design System Standards (Linear + Raycast Inspired)
- **Aesthetic**: Crisp slate/graphite dark mode (`#0d0d0f` background, `#141417` surface, `#23232a` border) and clean warm ivory light mode (`#fcfbfa`), accented with signature burnt orange (`--primary: #ea580c / #f97316`).
- **No Distorting Overlays**: Never use heavy destructive backdrop blur filters (`backdrop-blur-xl`, `bg-black/90`) that obscure content. Use clean, lightweight backdrops (`bg-black/50` or `dark:bg-black/70`).
- **Microinteractions**: Keep transitions subtle and purposeful (<=200ms cubic-bezier). Use optimistic checkmark pops (`animate-check-pop`) and card elevations.
- **Responsiveness**: Ensure flawless rendering from 360px mobile viewports up to 1440px+ ultra-wide screens.

## 4. Modal, Overlay & Portal Standards
- **MANDATORY React Portal**: All modals, slide-out drawers, confirmation dialogs, and toast stacks MUST be rendered via `createPortal(..., document.body)` with a hydration mount check (`const [mounted, setMounted] = React.useState(false)`).
- **Stacking Context Defense**: Never render fixed overlays directly inside components with CSS `transform`, `filter`, or `animation`, as they create a new containing block and trap `position: fixed` elements.
- **No Native Alert/Confirm**: Never use native `window.confirm()` or `window.alert()`. Always use the unified, accessible `DeleteConfirmDialog` component.
- **Accessibility**: Modals must include `role="dialog"`, `aria-modal="true"`, Escape key dismissal, focus trapping, and body scroll locking.

## 5. Optimistic UI Updates & State Latency Elimination
- **Zero-Latency Perceived UX**: When users complete tasks, check habits, increment goals, or delete items, update local React state immediately (optimistic UI).
- **Reconciliation & Rollback**: Call `router.refresh()` in the background to synchronize server state. If the server action returns an error, cleanly revert the local state and notify the user via `useToast()`.
- **Contextual Feedback**: Always provide informative, non-intrusive Toast feedback via `useToast()` on create, update, delete, and errors.

## 6. Testing & Quality Assurance Requirements
Before completing any task, execute:
1. `npx tsc --noEmit` — Zero TypeScript errors.
2. `npm run lint` — Zero ESLint warnings or errors.
3. `npm run build` — Successful Next.js production build.
4. Validation scripts in `scripts/` (e2e tasks, habits, streak engine, dashboard).
