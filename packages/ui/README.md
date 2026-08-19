# `@repo/ui`

Shared [shadcn/ui](https://ui.shadcn.com/) component library for the [Casa](../../README.md) monorepo, with Storybook for isolated development.

## Stack

- React 19 + Tailwind CSS v4
- [Base UI](https://base-ui.com/) primitives (`@base-ui/react`)
- `class-variance-authority`, `clsx`, `tailwind-merge` for variant/class handling
- `next-themes` for light/dark theming
- Storybook 10 (Vite builder) for component development, docs, and visual/a11y testing

## What's here

Each component lives in its own subdir, named `<ComponentName>/<slug>.tsx`, grouped by category. Each category has its own barrel:

| Directory | Import path | Description |
| --- | --- | --- |
| `src/components/ui/<ComponentName>` | `@repo/ui/components/ui` | Base shadcn/ui primitives |
| `src/components/composite/<ComponentName>` | `@repo/ui/components/composite` | Composed components built from primitives |
| `src/components/generic/<ComponentName>` | `@repo/ui/components/generic` | Other shared, non-shadcn components |
| `src/hooks` | `@repo/ui/hooks/*` | Shared React hooks |
| `src/lib/utils.ts` | `@repo/ui/lib/utils` | Shared helpers (e.g. `cn` for class merging) |
| `src/styles/globals.css` | `@repo/ui/globals.css` | Tailwind entry point and design tokens |

## Adding components

**shadcn primitives:**

```bash
pnpm exec shadcn add button
```

This drops `button.tsx` flat in `src/components/ui/`. Move it into its own subdir (`src/components/ui/Button/button.tsx`) and add the export line to `src/components/ui/index.ts`.

**Composite/generic components:** write the file directly at `src/components/{composite,generic}/<ComponentName>/<slug>.tsx`, then add its export line to that category's `index.ts`.

## Using components

Always import from a category's barrel, never a component's own path:

```tsx
import { Button } from "@repo/ui/components/ui"
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
