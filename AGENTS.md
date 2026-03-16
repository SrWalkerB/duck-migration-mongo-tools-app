# Duck Migration — Agent Guidelines

This document provides instructions for agentic coding assistants working in this repository.

## Project Architecture

Three-layer Tauri 2 desktop application for offline MongoDB-to-MongoDB migration:

| Layer | Tech | Location |
|---|---|---|
| Desktop shell | Rust + Tauri 2 | `src-tauri/` |
| Frontend UI | React 19 + TypeScript + Vite + Tailwind CSS v4 | `src/` |
| Migration engine | Node.js 22 + Fastify + MongoDB driver | `sidecar/` |

The Rust layer is intentionally minimal — it only spawns the Node.js sidecar and opens the native window. All business logic lives in the sidecar.

## Setup

Two separate `npm install` calls are required:

```bash
npm install                  # root (frontend + Tauri tooling)
cd sidecar && npm install    # sidecar (Node.js engine)
```

Prerequisites: Node.js 22+, Rust/Cargo, Tauri CLI.

## Build / Lint / Dev Commands

### Root (frontend + Tauri)

```bash
npm run dev          # Vite dev server (browser-only, no Tauri shell)
npm run build        # tsc -b && vite build (frontend production build)
npm run lint         # ESLint on src/ and vite.config.ts
npm run preview      # Preview the Vite production build
npx tauri dev        # Full desktop app with Tauri shell + sidecar
npx tauri build      # Package as distributable binary
```

### Sidecar (Node.js engine)

```bash
# from sidecar/
npm run dev          # tsx watch src/server.ts (hot-reload)
npm run build        # tsup → dist/server.js (ESM, Node 22 target)
npm run start        # node dist/server.js
```

### TypeScript type-check (no emit)

```bash
npx tsc -b --noEmit                     # frontend
cd sidecar && npx tsc --noEmit          # sidecar
```

### Tests

**There are currently no tests.** No test framework, no test files, no test scripts exist. When adding tests, prefer **Vitest** for both the frontend and sidecar (it integrates with the existing Vite config and ESM setup). A single test can be run with:

```bash
npx vitest run src/path/to/file.test.ts   # frontend
cd sidecar && npx vitest run src/path/to/file.test.ts
```

## Code Style

### TypeScript — General Rules

- `strict: true` everywhere. Never use `any`; prefer `unknown` for untyped external data.
- **Frontend only** — `noUnusedLocals` and `noUnusedParameters` are compile errors. Prefix intentionally unused parameters with `_` (e.g., `_request`).
- **Frontend only** — `verbatimModuleSyntax: true`: always use `import type` for type-only imports.
- **Frontend only** — `erasableSyntaxOnly: true`: `enum` and `namespace` are **forbidden**. Use string literal union types and `as const` objects instead.
- Use `interface` for object shapes. Use `type` for unions and aliases.
- Explicit return types on all public/exported functions in the sidecar; inferred return types are fine for frontend hooks and components.

### Imports

Order imports as follows (no blank line required between groups, but keep them grouped mentally):
1. Node built-ins using the `node:` protocol prefix (`node:crypto`, `node:path`)
2. Third-party packages (`fastify`, `zod`, `react`, `lucide-react`)
3. Internal imports via the `@/` alias (frontend only, maps to `src/`)
4. Relative internal imports (`../types`, `./services/database.js`)

In the sidecar, all relative imports **must** include `.js` extensions even though source files are `.ts` (required for Node ESM).

```ts
// Good — sidecar
import { DatabaseService } from './services/database.js'
import type { Connection } from '../types/index.js'

// Good — frontend
import type { Connection } from '@/types'
import { cn } from '@/lib/utils'
```

### Naming Conventions

| Thing | Convention | Example |
|---|---|---|
| React component files | PascalCase | `ConnectionForm.tsx` |
| Non-component files | camelCase | `migrator.ts`, `useWizard.ts` |
| React components | Named export (not default) | `export function Button(...)` |
| `App.tsx` | Default export (exception) | `export default App` |
| Hooks | `useXxx`, named export | `export function useMigration()` |
| Services | Named exports, plain `async function`s | `export async function testConnection(...)` |
| Interfaces | PascalCase | `interface MigrationConfig` |
| Type aliases / unions | PascalCase | `type ConflictStrategy = 'skip' \| 'overwrite'` |
| Module-level constants | SCREAMING_SNAKE_CASE | `const PORT = 45678` |

### File Header Comments

Every file starts with a branded block comment:

```ts
// =====================================================
// Duck Migration - [Module Name]
// [Short description]
// =====================================================
```

Inline code comments are written in **Portuguese**. UI-facing strings (labels, placeholders, button text) are in **English**.

### React Patterns

- Functional components only. No class components.
- `React.forwardRef` for UI primitives that accept refs; set `displayName`.
- Wrap state-mutating functions in `useCallback` within hooks.
- No Context API, Redux, or Zustand — state is local to hooks and passed as props.
- Use the `cn()` helper (`clsx` + `tailwind-merge`) for conditional Tailwind classes.
- Tailwind CSS v4 with `@theme` block in `src/index.css` — don't add a `tailwind.config.*` file.
- The `@/` path alias maps to `src/`. Always use it for frontend internal imports.

### Sidecar Patterns

- Each route file exports one `async function xxxRoutes(app: FastifyInstance): Promise<void>`.
- Zod schemas at module level; always use `safeParse()` (not `parse()`) to return 400s without throwing.
- Active migration state: module-level `let activeMigration` singleton.
- MongoDB clients: `Map<string, MongoClient>` cache to avoid reconnection overhead.
- SQLite via `better-sqlite3` (synchronous API — no `await` for DB calls).
- Sidecar listens on port **45678** (hardcoded `PORT` constant in `server.ts`).

### Error Handling

- Always `try/catch` around async operations. Never silently swallow errors.
- Use `error instanceof Error ? error.message : 'Fallback'` when extracting messages from `unknown` catches.
- Use `Promise.allSettled` (not `Promise.all`) for parallel collection migration — one failure must not abort others.
- API client fallback: `await response.json().catch(() => ({ error: 'Request failed' }))`.

### What to Avoid

- Do not add Prettier, Biome, or other formatters — none are configured and the CI does not enforce them.
- Do not add a `tailwind.config.*` file — Tailwind CSS v4 is configured entirely via CSS `@theme` and `@import`.
- Do not use `enum` or `namespace` in frontend TypeScript files.
- Do not use default exports in component files (except `App.tsx`).
- Do not add `.js` extensions to imports in frontend files — Vite/bundler resolution handles them.
- Do not use `any`; use `unknown` and narrow with guards.

## Key File Locations

| Purpose | File |
|---|---|
| All shared frontend types | `src/types/index.ts` |
| All shared sidecar types | `sidecar/src/types/index.ts` |
| HTTP client for sidecar API | `src/services/api.ts` |
| Base UI components | `src/components/ui/` |
| SQLite service (connections + history) | `sidecar/src/services/database.ts` |
| Core migration engine | `sidecar/src/services/migrator.ts` |
| Tauri shell setup | `src-tauri/src/lib.rs` |
| Architecture documentation | `docs/ARCHITECTURE.md` |

## Data

SQLite database lives in `sidecar/data/` (gitignored). It is created automatically on first sidecar start. Connection strings are encrypted with AES-256-CBC via `node:crypto`.
