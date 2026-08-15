# `@repo/shared`

Shared types, schemas, enums, constants, and utilities used across the [Casa](../../README.md) monorepo.

## What's here

| Directory | Import path | Description |
| --- | --- | --- |
| `src/payload-types.ts` | `@repo/shared/payload-types` | Types generated from the backend's Payload config. Regenerate with `pnpm generate:types` at the repo root (or `pnpm --filter backend generate:types`). Do not edit by hand. |
| `src/enums` | `@repo/shared/enums/*` | Shared enums |
| `src/constants` | `@repo/shared/constants/*` | Shared constants |
| `src/utils` | `@repo/shared/utils/*` | Shared utility functions |
| `src/types` | `@repo/shared/types/*` | Shared TypeScript types |
| `src/schemas` | `@repo/shared/schemas/*` | Shared Zod schemas |
| `src/mocks` | `@repo/shared/mocks/*` | Shared test/mock data |

## Usage

Add it as a workspace dependency and import from the specific subpath you need, e.g.:

```ts
import { someSchema } from "@repo/shared/schemas"
```

## Scripts

| Script | Description |
| --- | --- |
| `pnpm typecheck` | Type-check with `tsc --noEmit` |
| `pnpm lint:check` / `pnpm lint:fix` | Biome lint check / autofix |
