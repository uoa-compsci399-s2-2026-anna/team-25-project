# Casa

Team 25's project for COMPSCI 399 (University of Auckland). A Turborepo monorepo with a Next.js frontend, a Payload CMS backend on Postgres, and shared packages.

## Prerequisites

- **Node.js** — version pinned in `.nvmrc` / `package.json`'s `volta.node`
- **pnpm** — version pinned in `package.json`'s `packageManager`
- **PostgreSQL** instance (local or cloud) — only needed to run the backend

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

> [!WARNING]
> TODO: Environmental variables have not been set up yet

### 3. Start the development servers

```bash
pnpm dev
```

This starts the frontend, the backend, and Storybook together through Turborepo.

Once running with the default ports, the apps will be available at:

- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend / Payload admin**: [http://localhost:3001/payload/admin](http://localhost:3001/payload/admin)

## Structure

| Path | Description |
| --- | --- |
| [`apps/backend`](apps/backend/README.md) | Payload CMS backend, built on Next.js and Postgres |
| [`apps/frontend`](apps/frontend/README.md) | Public-facing Next.js app |
| [`packages/ui`](packages/ui/README.md) | Shared shadcn/ui component library, with Storybook |
| [`packages/shared`](packages/shared/README.md) | Shared types, schemas, enums, constants, and utils |
| [`packages/test-config`](packages/test-config/README.md) | Shared Vitest configs and coverage tooling |
| [`packages/typescript-config`](packages/typescript-config/README.md) | Shared `tsconfig.json` bases |

## Important scripts

Run from the repo root; Turborepo fans each one out to the workspaces that define it.

| Command | Description |
| --- | --- |
| `pnpm dev` | Start every app's dev server, plus Storybook |
| `pnpm dev:frontend` | Start only `apps/frontend` |
| `pnpm dev:backend` | Start only `apps/backend` |
| `pnpm dev:storybook` | Start only Storybook |
| `pnpm build` | Build all apps and Storybook |
| `pnpm build:app` | Build apps only (`apps/*`) |
| `pnpm types:check` | Type-check every workspace |
| `pnpm test` | Run tests in every workspace |
| `pnpm test:coverage:merge` | Merge per-workspace coverage reports |
| `pnpm lint:check` | Check lint/format rules (Biome) across the repo |
| `pnpm lint:fix` | Auto-fix lint/format issues across the repo |
| `pnpm types:generate` | Regenerate Payload's generated types |

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

Payload CMS generates TypeScript types from the backend's collections/globals config. They land in `packages/shared/src/payload-types.ts` and are exported as `@repo/shared/payload-types` for use anywhere in the monorepo.

```bash
pnpm types:generate
```

Never edit `payload-types.ts` by hand — it's regenerated automatically.

## Testing

| Workspace | How |
| --- | --- |
| `apps/backend` | `pnpm --filter backend test` — Vitest integration tests, then Playwright e2e |
| `apps/frontend` | `pnpm --filter frontend test` — Vitest |
| `packages/ui` | `pnpm --filter @repo/ui test` — Vitest, including Storybook interaction/a11y tests |

Or run everything at once from the root with `pnpm test`.

## Tech stack

### Core

- **[Next.js](https://nextjs.org/)** 16 (App Router) — both apps, with the frontend using Cache Components
- **[React](https://react.dev/)** 19, with the React Compiler enabled on the frontend
- **[TypeScript](https://www.typescriptlang.org/)** 7

### Content management

- **[Payload CMS](https://payloadcms.com/)** 3 — headless CMS with an admin panel, mounted in `apps/backend`
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
