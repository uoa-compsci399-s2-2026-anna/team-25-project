# Backend

Payload CMS backend, built on Next.js 16 and Postgres. Part of the [Casa](../../README.md) monorepo.

## Stack

- [Payload 3](https://payloadcms.com/docs) with the Postgres adapter (`@payloadcms/db-postgres`)
- Next.js 16 (App Router) hosting the Payload admin panel and REST/GraphQL API
- Zod for schema validation
- `@repo/shared` for generated Payload types and shared code

Payload's admin panel is mounted at `/payload/admin` and its API at `/payload/api` (see `src/payload.config.ts`).

## Prerequisites

- A Postgres database the app can connect to
- Node.js 20+ and pnpm (see the [root README](../../README.md#prerequisites))

## Environment variables

Copy `.env.example` to `.env` and fill in:

| Variable | Description |
| --- | --- |
| `DATABASE_URL` | Postgres connection string |
| `PAYLOAD_SECRET` | Secret used by Payload to sign/encrypt data |

## Development

From the repo root:

```bash
pnpm install
pnpm dev:backend
```

Or from this directory:

```bash
pnpm dev
```

Open `http://localhost:3000/payload/admin` and follow the on-screen instructions to create your first admin user.

If you need a clean `.next` build cache, use `pnpm devsafe` instead of `pnpm dev`.

## Migrations

This app uses Payload's Postgres migrations (stored in `src/payload/migrations`):

```bash
pnpm migrate          # run pending migrations
pnpm migrate:create   # generate a new migration
pnpm migrate:status   # check migration status
```

## Generated types

Payload types are generated into `packages/shared/src/payload-types.ts` and exported from `@repo/shared/payload-types`. Regenerate them after changing collections or globals:

```bash
pnpm generate:types  // from the apps/backend directory
// or
pnpm types:generate  // from the root directory
```

## Testing

```bash
pnpm test        # runs test:int then test:e2e
pnpm test:int    # Vitest integration tests
pnpm test:e2e    # Playwright end-to-end tests
```

## Other scripts

| Script | Description |
| --- | --- |
| `pnpm build` | Production build |
| `pnpm start` | Start the production server |
| `pnpm types:check` | Type-check with `tsc --noEmit` |
| `pnpm lint:check` / `pnpm lint:fix` | Biome lint check / autofix |
| `pnpm generate:importmap` | Regenerate the Payload admin import map |
| `pnpm payload` | Run arbitrary Payload CLI commands |

## API reference

An OpenAPI/Scalar reference is wired up via `@asteasolutions/zod-to-openapi` and `@scalar/nextjs-api-reference` (see `src/lib/openapi.ts` and `src/lib/swagger.ts`).
Ensure that all API routes are properly documented with `zod` schemas and show up in the Scalar UI.
