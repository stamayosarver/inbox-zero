# Repository Guidelines

Inbox Zero is an open-source AI email assistant built as a Next.js monorepo (`apps/web` + `packages/*`) using pnpm workspaces and Turborepo. The main app lives at `apps/web`.

## Build & Test Commands

- **Install**: `pnpm install` (run before tests or build if not already done)
- **Development**: `pnpm dev` (do not run unless explicitly asked)
- **Build**: `pnpm build` (do not run unless explicitly asked)
- **Lint**: `pnpm lint` (runs Biome via `biome check .`)
- **Format check/fix**: `pnpm check` / `pnpm fix` (via ultracite, which wraps Biome)
- **Run all unit tests**: `pnpm test`
- **Run a single test**: `pnpm test apps/web/utils/example.test.ts`
- **Run AI tests** (uses real LLM calls): `pnpm test-ai`
- **Run a specific AI test**: `pnpm test-ai ai-categorize-senders`
- **Type-check build** (skips Prisma migrate): `pnpm --filter inbox-zero-ai exec next build`
- Test framework is **Vitest** with `vite-tsconfig-paths` for alias resolution. Config: `apps/web/vitest.config.mts`. Setup file: `apps/web/__tests__/setup.ts`.

## Project Structure

```
apps/web/              Main Next.js app (App Router)
  app/(app)/           Authenticated app routes
  app/api/             API routes
  components/          Shared reusable components
  utils/               Utilities, server actions, AI logic
  utils/actions/       Server actions (next-safe-action)
  utils/middleware.ts   API route middleware (withError, withAuth, etc.)
  prisma/              Schema and migrations
  __tests__/           AI tests, E2E tests, and eval suites only
packages/              Shared workspace packages (tinybird, resend, loops, etc.)
```

## Code Style

### Formatting & Linting
- **Biome** for linting and formatting (configured in `biome.json`, extended via ultracite)
- 2-space indentation, double quotes, trailing commas
- No `console.log` in production code (Biome warns); use the logger instead
- Unused imports and variables trigger warnings

### TypeScript
- Strict null checks enabled
- Path alias: `@/` resolves to `apps/web/` root (e.g., `import { foo } from "@/utils/foo"`)
- Infer types from Zod schemas (`z.infer<typeof schema>`) instead of duplicating interfaces
- Do not export types/interfaces only used within the same file

### Imports & Modules
- All imports at the top of files; no mid-file dynamic imports
- Import lodash functions individually: `import groupBy from "lodash/groupBy"`
- No barrel files. Import directly from the source file, not re-exports.
- Install packages in `apps/web`, not root: `cd apps/web && pnpm add <pkg>`

### Prisma (v7)
- Client: `import prisma from "@/utils/prisma"`
- Enums: `import { ActionType } from "@/generated/prisma/enums"` (NOT `@prisma/client`)
- Types: `import type { Rule } from "@/generated/prisma/client"` (NOT `@prisma/client`)
- Schema: `apps/web/prisma/schema.prisma`
- Never use dynamic Prisma transactions (`prisma.$transaction(async (tx) => ...)`)

### File Organization
- Helper functions go at the bottom of files, not the top
- Co-locate test files next to source (e.g., `utils/example.test.ts`). Only E2E and AI tests go in `__tests__/`.
- Colocate page components next to their `page.tsx`. No nested `components/` subfolders in route dirs.
- Reusable components shared across pages go in `apps/web/components/`
- One resource per API route file
- Comments explain "why", not "what". Prefer self-documenting code.

### Error Handling
- Use `SafeError` for user-facing errors (returns 400 with `isKnownError: true`)
- API middleware automatically catches `ZodError` (400), `SafeError` (400), and unknown errors (500 + Sentry)
- Server actions: errors are handled by the `next-safe-action` client; use `SafeError` for expected failures
- Client-side: use `getActionErrorMessage(error.error)` with `toastError()` for action errors

### Logging
- Use `createScopedLogger(scope)` only outside the middleware chain (scripts, tests)
- In API routes, logger comes from `request.logger`; in server actions, from `ctx.logger`
- Enrich context with `logger = logger.with({ key: value })`; do not duplicate fields from higher in the call chain
- Use `logger.trace()` for PII fields (from, to, subject, etc.)
- Tests should use the real logger (do not mock `@/utils/logger`)

## API Route Middleware

Four tiers, each adding more context to the request:

| Wrapper | Auth | Provides | Use Case |
|---|---|---|---|
| `withError` | None | `request.logger` | Public endpoints |
| `withAuth` | Session | `.auth.userId` | User-level endpoints |
| `withEmailAccount` | Session + account | `.emailAccountId`, `.email` | Account-scoped endpoints |
| `withEmailProvider` | Session + provider | `.emailProvider` | Provider interaction |

Export response types: `export type MyResponse = Awaited<ReturnType<typeof getData>>;`

## Server Actions (Mutations)

- Use `next-safe-action` with server actions, NOT POST API routes (exception: mobile-native integrations)
- Three action clients: `actionClient` (email-account-level), `actionClientUser` (user-level), `adminActionClient`
- Always set `.metadata({ name: "actionName" })` for Sentry instrumentation
- Validation schemas in `utils/actions/*.validation.ts`
- Client-side: React Hook Form + `useAction` hook. Call SWR `mutate()` after mutations.

## Component Guidelines

- Use **shadcn/ui** (Radix UI + Tailwind) components when available
- Use `LoadingContent` for async data: `<LoadingContent loading={isLoading} error={error}>{data && <Component />}</LoadingContent>`
- Data fetching: SWR on the client
- Forms: React Hook Form + `useAction` hook

## Environment Variables

- Validated with `@t3-oss/env-nextjs` + Zod in `apps/web/env.ts`
- When adding a new env var: add to `.env.example`, `env.ts`, and `turbo.json`
- Client-side vars must be prefixed with `NEXT_PUBLIC_`
- Use the `EmailProvider` abstraction; only use provider-type checks (`isGoogleProvider`, `isMicrosoftProvider`) at true provider boundaries

## Testing Guidelines

- Prefer behavior-focused assertions; avoid freezing prompt copy or internal call shapes
- Avoid low-value tests that restate implementation details; test real behavioral regressions
- AI tests (`__tests__/ai-*.test.ts`) make real LLM calls; run with `pnpm test-ai`
- Eval suites (`__tests__/eval/`) use LLM-as-judge patterns for cross-model comparison
- E2E tests (`__tests__/e2e/`) run real email workflows against Gmail/Outlook test accounts

## Change Philosophy

- Prefer the simplest, most readable change
- Avoid premature abstraction; duplicating 2-3 times is fine, extract when a stable pattern emerges
- Do not extract single-use helpers that just rename and forward parameters; inline the logic
- Do not optimize for migration paths; refactor call sites directly
- For Next.js behavior, check `node_modules/next/dist/docs/` before changing framework code

## LLM Features

- Stay AI-first: fix general failure modes, not exact eval wording
- Avoid brittle keyword or regex rules unless the product needs a hard guard
- LLM provider config: `DEFAULT_LLM_PROVIDER`, `ECONOMY_LLM_PROVIDER`, `CHAT_LLM_PROVIDER`, `NANO_LLM_PROVIDER` in env

## Docker

- When adding a new workspace package, add its `package.json` COPY line to `docker/Dockerfile.prod` and `docker/Dockerfile.local`
