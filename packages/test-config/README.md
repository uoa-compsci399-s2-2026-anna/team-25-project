# `@repo/test-config`

Shared Vitest configuration and coverage tooling for the [Casa](../../README.md) monorepo.

## What's here

| Export | Description |
| --- | --- |
| `@repo/test-config/ui` | Vitest config preset for `packages/ui` |
| `@repo/test-config/backend` | Vitest config preset for `apps/backend` |
| `@repo/test-config/frontend` | Vitest config preset for `apps/frontend` |
| `@repo/test-config/setups/dom` | Shared DOM test setup (`@testing-library/jest-dom`, etc.) |

Consuming workspaces import the relevant preset in their own `vitest.config.ts`/`vitest.config.mts` rather than duplicating Vitest setup.

## Coverage merging

```bash
pnpm coverage:merge
```

Merges per-workspace coverage reports into one. Run from the repo root via `pnpm test:coverage:merge`.

## Scripts

| Script | Description |
| --- | --- |
| `pnpm build` | Compile configs with `tsc` (required before other workspaces can import them) |
| `pnpm types:check` | Type-check with `tsc --noEmit` |
| `pnpm lint:check` / `pnpm lint:fix` | Biome lint check / autofix |
| `pnpm coverage:merge` | Merge coverage reports across workspaces |
