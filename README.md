# Casa

Team 25's project for COMPSCI 399 (University of Auckland). A Turborepo monorepo with a full-stack Next.js + Payload CMS app on Postgres, and shared packages.

## Prerequisites

- **Node.js** — version pinned in `.nvmrc` / `package.json`'s `volta.node`
- **pnpm** — version pinned in `package.json`'s `packageManager`
- **Docker** — runs the local Postgres database via `docker compose` (or bring your
  own PostgreSQL instance, local or cloud)

### Node.js installation

#### nvm (Node Version Manager)

The root `.nvmrc` file specifies the required Node.js version. If you have `nvm` installed:

```bash
nvm install
nvm use
```

#### Volta

If you use [Volta](https://volta.sh/), the project automatically uses the Node.js version pinned in `package.json` (`volta.node`). Follow the [Volta installation instructions](https://docs.volta.sh/guide/getting-started) if you don't have it installed.

## Setting Up the Project

### 1. Install dependencies

`package.json` pins an exact pnpm version via `packageManager`, so enable Corepack first so it's used automatically:

```bash
corepack enable
pnpm install
```

`pnpm install` also installs the Lefthook Git hooks (via the `postinstall` script).

### 2. Environment setup

Copy the app's env template and keep the defaults — they match the local Postgres
container:

```bash
cp apps/web/.env.example apps/web/.env
```

| Variable | Description |
| --- | --- |
| `DATABASE_URL` | Postgres connection string (`postgres://casa:casa@localhost:5432/casa` for the container) |
| `PAYLOAD_SECRET` | Secret used by Payload to sign/encrypt data |

### 3. Start the local database

```bash
docker compose up -d          # start Postgres, leave it running
pnpm --filter web migrate     # apply migrations
pnpm db:seed                  # create the first admin user
```

`docker compose down -v` wipes the database; re-run `pnpm db:seed` to rebuild it.

### 4. Start the development servers

```bash
pnpm dev
```

This starts the app and Storybook together through Turborepo.

Once running with the default ports:

- **App**: [http://localhost:3000](http://localhost:3000)
- **Payload admin**: [http://localhost:3000/payload/admin](http://localhost:3000/payload/admin)

## Structure

| Path | Description |
| --- | --- |
| [`apps/web`](apps/web/README.md) | Full-stack Next.js app: product UI + Payload CMS (admin, REST API) on Postgres |
| [`packages/ui`](packages/ui/README.md) | Shared shadcn/ui component library, with Storybook |
| [`packages/shared`](packages/shared/README.md) | Shared types, schemas, enums, constants, and utils |
| [`packages/test-config`](packages/test-config/README.md) | Shared Vitest configs and coverage tooling |
| [`packages/typescript-config`](packages/typescript-config/README.md) | Shared `tsconfig.json` bases |

## Important scripts

Run from the repo root; Turborepo fans each one out to the workspaces that define it.

| Command | Description |
| --- | --- |
| `pnpm dev` | Start the app's dev server, plus Storybook |
| `pnpm dev:web` | Start only `apps/web` |
| `pnpm dev:storybook` | Start only Storybook |
| `pnpm build` | Build the app and Storybook |
| `pnpm build:app` | Build apps only (`apps/*`) |
| `pnpm types:check` | Type-check every workspace |
| `pnpm test` | Run tests in every workspace |
| `pnpm test:coverage:merge` | Merge per-workspace coverage reports |
| `pnpm lint:check` | Check lint/format rules (Biome) across the repo |
| `pnpm lint:fix` | Auto-fix lint/format issues across the repo |
| `pnpm types:generate` | Regenerate Payload's generated types |
| `pnpm db:seed` | Seed a fresh database with the first admin user |

Per-app scripts (migrations, Playwright, Storybook builds, etc.) are documented in each workspace's own README, linked in [Structure](#structure) above.

## Linting & formatting

This project uses **[Biome](https://biomejs.dev/)** for linting and formatting.

```bash
pnpm lint:check   # check for issues
pnpm lint:fix     # auto-fix what can be fixed
```

Lefthook runs Biome against staged files automatically before every commit, so you should rarely need to run these by hand.

## IDE setup

### VS Code

The repo ships `.vscode/extensions.json`, `settings.json`, and `launch.json`. Opening the project in VS Code will prompt you to install the recommended extension (Biome), which then handles formatting for you.

### Zed

A `.zed/settings.json` is also included for Zed users.

Other IDEs work too, feel free to add relevant config to the repository.

## Type generation

Payload CMS generates TypeScript types from the app's collections/globals config. They land in `packages/shared/src/payload-types.ts` and are exported as `@repo/shared/payload-types` for use anywhere in the monorepo.

```bash
pnpm types:generate
```

Never edit `payload-types.ts` by hand — it's regenerated automatically.

## Testing

| Workspace | How |
| --- | --- |
| `apps/web` | `pnpm --filter web test` — Vitest (`node` project for `*.test.ts`, `jsdom` project for `*.test.tsx`) |
| `packages/ui` | `pnpm --filter @repo/ui test` — Vitest, including Storybook interaction/a11y tests |

Or run everything at once from the root with `pnpm test`.

## Tech stack

### Core

- **[Next.js](https://nextjs.org/)** 16 (App Router), with Cache Components
- **[React](https://react.dev/)** 19, with the React Compiler enabled
- **[TypeScript](https://www.typescriptlang.org/)** 7

### Content management

- **[Payload CMS](https://payloadcms.com/)** 3 — headless CMS with an admin panel, mounted in `apps/web`
- **[PostgreSQL](https://www.postgresql.org/)** via `@payloadcms/db-postgres`

### Styling & UI

- **[Tailwind CSS](https://tailwindcss.com/)** v4
- **[shadcn/ui](https://ui.shadcn.com/)** + **[Base UI](https://base-ui.com/)** primitives, in `packages/ui`
- **[Zod](https://zod.dev/)** for schema validation

### Monorepo & tooling

- **[Turborepo](https://turborepo.com/)** — task orchestration and caching
- **[pnpm](https://pnpm.io/)** workspaces — package management
- **[Biome](https://biomejs.dev/)** — linting and formatting
- **[Lefthook](https://lefthook.dev/)** — Git hooks
- **[Commitlint](https://commitlint.js.org/)** — Conventional Commits enforcement
- **[Storybook](https://storybook.js.org/)** — component development for `packages/ui`
- **[Vitest](https://vitest.dev/)** + **[Playwright](https://playwright.dev/)** — testing

## Learn more

- [Next.js Documentation](https://nextjs.org/docs)
- [Payload CMS Documentation](https://payloadcms.com/docs)
- [Turborepo Documentation](https://turborepo.com/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Storybook Docs](https://storybook.js.org/docs)
- [Biome Documentation](https://biomejs.dev/guides/getting-started/)
- [Lefthook Documentation](https://lefthook.dev/)

## Contributing

Commit messages must follow [Conventional Commits](https://www.conventionalcommits.org/) — Commitlint checks this on every commit.
Use the issue templates in `.github/ISSUE_TEMPLATE/` and the PR template in `.github/pull_request_template.md` when opening issues and pull requests.
