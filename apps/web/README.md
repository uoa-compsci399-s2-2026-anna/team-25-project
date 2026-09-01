# Web

The full-stack app: a single Next.js 16 App Router project that hosts both the
product UI and Payload CMS (admin panel and REST API). Part of the
[Casa](../../README.md) monorepo.

## Stack

- Next.js 16 (App Router), with `cacheComponents`, the React Compiler, and typed
  routes enabled (`next.config.ts`)
- [Payload 3](https://payloadcms.com/docs) with the Postgres adapter
  (`@payloadcms/db-postgres`)
- Tailwind CSS v4
- `@repo/ui` for shared shadcn/ui components, `lucide-react` for icons
- `@repo/shared` for the generated Payload types
- Zod for schema validation

### App directory layout

`src/app/` is split into two route groups, each with its own root layout:

| Group | Serves | Layout |
| --- | --- | --- |
| `src/app/(app)/` | Product UI (`/`) and the app's own route handlers (`/api/health`, `/api/openapi`, `/api/docs`) | Satoshi + Geist Mono fonts, `@repo/ui` global styles |
| `src/app/(payload)/` | Payload admin at `/payload/admin`, Payload REST API at `/payload/api` | Payload's `RootLayout` |

Payload's own collections, globals, and migrations live outside the route group,
under `src/payload/`.

`cacheComponents` makes every component tree static by default: `fetch()`,
`cookies()`, `headers()`, `searchParams`, and dynamic `params` all require a
`<Suspense>` boundary or a `"use cache"` function. See `AGENTS.md` at the repo
root.

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
pnpm dev:web
```

Or from this directory:

```bash
pnpm dev
```

- App: [http://localhost:3000](http://localhost:3000)
- Payload admin: [http://localhost:3000/payload/admin](http://localhost:3000/payload/admin)
  — follow the on-screen instructions to create your first admin user.

If you need a clean `.next` build cache, use `pnpm devsafe` instead of `pnpm dev`.

## Migrations

Payload's Postgres migrations are stored in `src/payload/migrations`:

```bash
pnpm migrate          # run pending migrations
pnpm migrate:create   # generate a new migration
pnpm migrate:status   # check migration status
```

## Generated types

`pnpm generate:types` runs both `payload generate:types` (writes
`packages/shared/src/payload-types.ts`, exported from `@repo/shared/payload-types`)
and `next typegen` (typed routes). Regenerate after changing collections,
globals, or routes. From the repo root use `pnpm types:generate`.

Never edit `payload-types.ts` by hand.

## Testing

```bash
pnpm test
```

Vitest runs two projects from one config (`vitest.config.mts`): a `node` project
for `src/**/*.test.ts` (Payload, API route handlers) and a `jsdom` project for
`src/**/*.test.tsx` (components, hooks).

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

An OpenAPI/Scalar reference is wired up via `@asteasolutions/zod-to-openapi` and
`@scalar/nextjs-api-reference` (see `src/lib/openapi.ts` and `src/lib/swagger.ts`).
Document all route handlers with `zod` schemas so they show up in the Scalar UI at
`/api/docs`.
