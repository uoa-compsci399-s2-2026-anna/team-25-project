# `@repo/ui`

Shared [shadcn/ui](https://ui.shadcn.com/) component library for the [Casa](../../README.md) monorepo, with Storybook for isolated development.

## Stack

- React 19 + Tailwind CSS v4
- [Base UI](https://base-ui.com/) primitives (`@base-ui/react`)
- `class-variance-authority`, `clsx`, `tailwind-merge` for variant/class handling
- `next-themes` for light/dark theming
- Storybook 10 (Vite builder) for component development, docs, and visual/a11y testing

## What's here

| Directory | Import path | Description |
| --- | --- | --- |
| `src/components/ui` | `@repo/ui/components/*` | Base shadcn/ui primitives |
| `src/components/composite` | `@repo/ui/components/*` | Composed components built from primitives |
| `src/components/generic` | `@repo/ui/components/*` | Other shared, non-shadcn components |
| `src/hooks` | `@repo/ui/hooks/*` | Shared React hooks |
| `src/lib/utils.ts` | `@repo/ui/lib/utils` | Shared helpers (e.g. `cn` for class merging) |
| `src/styles/globals.css` | `@repo/ui/globals.css` | Tailwind entry point and design tokens |

## Adding components

Add shadcn/ui components from `apps/frontend` so they're generated with the right config, then they land here:

```bash
pnpm dlx shadcn@latest add button -c apps/frontend
```

## Using components

```tsx
import { Button } from "@repo/ui/components/button"
```

## Storybook

```bash
pnpm storybook:start   # dev server on http://localhost:6006
pnpm storybook:build   # static build
```

Or from the repo root: `pnpm dev:storybook` / `pnpm build:storybook`.

## Scripts

| Script | Description |
| --- | --- |
| `pnpm types:check` | Type-check with `tsc --noEmit` |
| `pnpm lint:check` / `pnpm lint:fix` | Biome lint check / autofix |
| `pnpm test` | Run Vitest tests (including Storybook interaction tests via `@storybook/addon-vitest`) |
