# Frontend

Public-facing Next.js 16 app. Part of the [Casa](../../README.md) monorepo.

## Stack

- Next.js 16 (App Router), with `cacheComponents` and the React Compiler enabled (`next.config.ts`)
- Tailwind CSS v4
- `@repo/ui` for shared shadcn/ui components
- `lucide-react` for icons

`cacheComponents` makes every component tree static by default: `fetch()`, `cookies()`, `headers()`, `searchParams`, and dynamic `params` all require a `<Suspense>` boundary or a `"use cache"` function. See `AGENTS.md` at the repo root for details.

## Development

From the repo root:

```bash
pnpm install
pnpm dev:frontend
```

Or from this directory:

```bash
pnpm dev
```

Open `http://localhost:3000`.

## Adding UI components

Components live in `@repo/ui`. See [`packages/ui/README.md`](../../packages/ui/README.md) for how to add one. Import via:

```tsx
import { Button } from "@repo/ui/components/ui"
```

## Scripts

| Script | Description |
| --- | --- |
| `pnpm dev` | Start the dev server |
| `pnpm build` | Production build |
| `pnpm start` | Start the production server |
| `pnpm types:check` | Type-check with `tsc --noEmit` |
| `pnpm lint:check` / `pnpm lint:fix` | Biome lint check / autofix |
| `pnpm test` | Run Vitest tests |
