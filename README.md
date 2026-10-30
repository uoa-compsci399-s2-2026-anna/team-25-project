# Computing Capstone Community Australasia (CCCA)

COMPSCI 399 capstone project by Team 25, Cache Me Outside (University of Auckland).

- **Live website**: [https://cccacommunity.org](https://cccacommunity.org)
- **Project management**: [GitHub Project board](https://github.com/orgs/uoa-compsci399-s2-2026-anna/projects/1/views/1)

## About the project

CCCA is a website for academics and teaching staff who run computing capstone courses at universities in Australia and New Zealand. It gives this community one place to:

- Keep a directory of capstone academics, their institutions and the courses they convene.
- Record course data each year, so that members can compare course designs across institutions.
- Share course resources and publications.
- Post research proposals and find co-researchers.

Members sign up with an institutional email address. Admins manage institutions and members through the Payload CMS admin panel.

The repository is a Turborepo monorepo. It holds a full-stack Next.js and Payload CMS app on PostgreSQL (`apps/web`), plus shared packages (`packages/*`).

## Prerequisites

- **Node.js**: version pinned in `.nvmrc` / `package.json`'s `volta.node`
- **pnpm**: version pinned in `package.json`'s `packageManager`
- **Docker**: runs the local Postgres database via `docker compose` (or bring your
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

Copy the app's env template and keep the defaults (they match the local Postgres container):

```bash
cp apps/web/.env.example apps/web/.env
```

| Variable | Description |
| --- | --- |
| `DATABASE_URL` | Postgres connection string (`postgres://ccca:ccca@localhost:5432/ccca` for the container) |
| `PAYLOAD_SECRET` | Secret used by Payload to sign/encrypt data |
| `NEXT_PUBLIC_URL` | Public URL of the site (`http://localhost:3000` locally) |
| `S3_BUCKET`, `S3_REGION` | Optional. S3 bucket for uploaded files. Leave empty to store files on the local disk |
| `AWS_PROFILE`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` | Optional. AWS credentials for S3 and SES |
| `SES_FROM_ADDRESS` | Optional. Sender address for Amazon SES email. Leave empty to log emails to the server console |
| `SES_REGION` | Optional. AWS region for SES. Leave empty to use the region of your AWS profile |

#### AWS credentials (optional)

You need AWS credentials only if you set `S3_BUCKET` or `SES_FROM_ADDRESS`. The team's AWS account uses the University of Auckland's AWS IAM Identity Center (SSO).

1. Install the [AWS CLI v2](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html).
2. Configure an SSO profile. Use any profile name you like:

   ```bash
   aws configure sso
   ```

   When the CLI asks, enter these values:

   | Prompt | Value |
   | --- | --- |
   | SSO session name | Any name |
   | SSO start URL | `https://uoa-sso.awsapps.com/start` |
   | SSO region | `ap-southeast-2` |
   | SSO registration scopes | `sso:account:access` |

   A browser window opens. Sign in with your university account, then select the team's account and the `StudentCoursePermissionSet` role. Set the default region to `ap-southeast-2`.

3. Set `AWS_PROFILE` in `apps/web/.env` to the profile name that you chose. Leave `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` empty.
4. Make sure that the login works:

   ```bash
   aws sts get-caller-identity --profile <your-profile>
   ```

SSO sessions expire after some hours. If S3 uploads or emails fail with an expired token error, sign in again and restart the dev server:

```bash
aws sso login --profile <your-profile>
```

### 3. Start the local database

```bash
docker compose up -d          # start Postgres, leave it running
pnpm --filter web migrate     # apply migrations
pnpm db:seed                  # create the admin user and development fixtures
```

`docker compose down -v` wipes the database; re-run `pnpm db:seed` to rebuild it.

### 4. Start the development servers

```bash
pnpm dev
```

This starts the app and Storybook together through Turborepo.

Once running with the default ports:

- **App**: [http://localhost:3000](http://localhost:3000)
- **Payload admin**: [http://localhost:3000/admin](http://localhost:3000/admin)
- **Storybook**: [http://localhost:6006](http://localhost:6006)

To run only the Application (not Storybook), use:

```bash
pnpm dev:app
```

## Usage examples

After you seed the database, you can sign in with these accounts:

| Account | Email | Password |
| --- | --- | --- |
| Admin | `admin@example.com` (or `SEED_ADMIN_EMAIL`) | `changeme` (or `SEED_ADMIN_PASSWORD`) |
| Member | `arohan.patel@auckland.ac.nz` (and other seeded members) | `changeme` |

Guests can browse `/members`, `/courses`, `/resources`, `/publications` and `/proposals`.

### Register and verify an email (guest)

1. Open `/register`. Enter your name, email and password, and select an institution, for example "University of Auckland" with an `@auckland.ac.nz` address.
2. Enter the six-digit code from the email. Locally, the code is in the server console.
3. Complete the profile step, or skip it and complete it later.

If the email domain is not accepted by the institution, the site shows an error and does not send a code. A code expires after 15 minutes, or after five wrong attempts.

### Add and publish a course offering (member)

1. Sign in as a member and open `/courses`.
2. Add a course. Enter the course code and name, delivery format, project type, learning outcomes, assessments, teaching period and teaching team.
3. Publish the offering. All signed-in members can then see it.

You can also save it as a draft. A draft can be incomplete, and only the course's owner, its editors and admins can see it.

### Correct a published offering (owner or editor)

1. Open a course that you own or edit, and edit the offering.
2. Publish the changes.

The site saves the changes as a new version and keeps the earlier versions in the offering's history. If nothing changed, the site refuses the correction.

### Manage an institution's email domains (admin)

1. Sign in at `/admin` and open **Institutions**.
2. Open an institution, add or remove an accepted email domain, and save.

New registrations for that institution must then use one of the listed domains. To add a new university, create an institution with its name, location, logo and email domains.

Admins cannot add, edit or delete content on the website. They make all changes in the admin panel.

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
| `pnpm test:e2e` | Run the Playwright end-to-end tests |
| `pnpm test:coverage:merge` | Merge per-workspace coverage reports |
| `pnpm lint:check` | Check lint/format rules (Biome) across the repo |
| `pnpm lint:fix` | Auto-fix lint/format issues across the repo |
| `pnpm types:generate` | Regenerate Payload's generated types |
| `pnpm db:seed` | Seed a fresh database with the admin user and development fixtures |

Per-app scripts (migrations, Storybook builds, etc.) are documented in each workspace's own README, linked in [Structure](#structure) above.

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

Never edit `payload-types.ts` by hand. It is regenerated automatically.

## Testing

| Workspace | How |
| --- | --- |
| `apps/web` | `pnpm --filter web test` (Vitest, with a `node` project for `*.test.ts` and a `jsdom` project for `*.test.tsx`) |
| `packages/ui` | `pnpm --filter @repo/ui test` (Vitest, `jsdom`) |
| `packages/shared` | `pnpm --filter @repo/shared test` (Vitest) |

Or run everything at once from the root with `pnpm test`.

To get coverage reports, run `pnpm test:coverage`, then `pnpm test:coverage:merge` to merge the reports from each workspace into one.

### End-to-end tests

`apps/web/e2e/` holds Playwright tests. They need the Postgres container running.

```bash
pnpm --filter web exec playwright install chromium   # once
pnpm test:e2e
```

Each run resets and seeds a separate `ccca_e2e` database, so your dev data is safe. It then starts the app on port 3100: `next dev` locally, and a production build in CI. S3 and SES are turned off for the run. To use a different database, set `E2E_DATABASE_URL`.

## Tech stack

Languages: **TypeScript** (7.0), **CSS** (Tailwind), **SQL** (PostgreSQL migrations) and **Shell**/**YAML** for CI and deployment.

### Runtime and package management

| Tool | Version |
| --- | --- |
| [Node.js](https://nodejs.org/) | 26.5.1 (`>=24`) |
| [pnpm](https://pnpm.io/) | 11.18.0 |
| [PostgreSQL](https://www.postgresql.org/) | 18 (Docker image `postgres:18`) |
| [Docker](https://www.docker.com/) | Any recent version, for the local database |

### App (`apps/web`)

| Library | Version | Purpose |
| --- | --- | --- |
| [Next.js](https://nextjs.org/) | 16.4.2 | App Router framework, with Cache Components |
| [React](https://react.dev/) / React DOM | 19.3.0 | UI, with the React Compiler (`babel-plugin-react-compiler` ^1.0.0) |
| [Payload CMS](https://payloadcms.com/) | 3.87.1 | Headless CMS, admin panel and REST API |
| `@payloadcms/db-postgres` | 3.87.1 | PostgreSQL adapter |
| `@payloadcms/richtext-lexical` | 3.87.1 | Rich text editor |
| `@payloadcms/storage-s3` | 3.87.1 | File uploads to Amazon S3 |
| `@payloadcms/email-nodemailer` / [Nodemailer](https://nodemailer.com/) | 3.87.1 / ^9.1.1 | Email |
| `@aws-sdk/client-sesv2` | ^3.1152.0 | Amazon SES email sending |
| [TanStack Form](https://tanstack.com/form) | ^1.33.5 | Forms |
| [TanStack Table](https://tanstack.com/table) | ^9.2.4 | Data tables |
| [TanStack Pacer](https://tanstack.com/pacer) | ^0.24.0 | Debounce and throttle |
| [dnd kit](https://dndkit.com/) | core ^6.3.1, sortable ^10.0.0 | Drag-and-drop ordering |
| [nuqs](https://nuqs.dev/) | ^2.10.1 | URL search parameter state |
| [Zod](https://zod.dev/) | ^4.4.3 | Schema validation |
| [cobe](https://cobe.vercel.app/) | ^2.0.1 | Home page globe |
| [Lucide](https://lucide.dev/) | ^1.28.0 | Icons |
| [sharp](https://sharp.pixelplumbing.com/) | 0.34.2 | Image processing |

### UI library (`packages/ui`)

| Library | Version | Purpose |
| --- | --- | --- |
| [Tailwind CSS](https://tailwindcss.com/) | ^4 (4.3.0) | Styling |
| [shadcn/ui](https://ui.shadcn.com/) | ^4.16.1 | Component library |
| [Base UI](https://base-ui.com/) | ^1.6.0 | Accessible UI primitives |
| [Lexical](https://lexical.dev/) | 0.41.0 | Rich text rendering and editing |
| `class-variance-authority`, `clsx`, `tailwind-merge` | ^0.7.1, ^2.1.1, ^3.6.0 | Class name helpers |
| `tw-animate-css` | ^1.4.0 | Animations |
| `react-fast-marquee` | 1.6.4 | Institutions ticker |

### Shared code (`packages/shared`)

| Library | Version | Purpose |
| --- | --- | --- |
| `@retorquere/bibtex-parser` | ^11.0.0 | BibTeX import for publications |
| [Zod](https://zod.dev/)  | ^4.4.3 | Shared schemas |

### Tooling and testing

| Tool | Version | Purpose |
| --- | --- | --- |
| [Turborepo](https://turborepo.com/) | ^2.9.18 | Task orchestration and caching |
| [Biome](https://biomejs.dev/) | ^2.5.8 | Linting and formatting |
| [Lefthook](https://lefthook.dev/) | ^2.1.10 | Git hooks |
| [Commitlint](https://commitlint.js.org/) | ^21.2.1 | Conventional Commits checks |
| [Storybook](https://storybook.js.org/) | ^10.5.5 | Component development for `packages/ui` |
| [Vitest](https://vitest.dev/) | 4.1.10 | Unit and component tests |
| [Testing Library](https://testing-library.com/) | React 16.3.0, DOM 10.4.1 | Component tests |
| [Playwright](https://playwright.dev/) | ^1.64.1 | End-to-end tests |
| [tsx](https://tsx.is/) | 4.22.4 | Runs TypeScript scripts (seed, migrations) |

### Hosting

The production site runs on AWS (`ap-southeast-2`): a Docker container on Amazon ECS, Amazon RDS for PostgreSQL, Amazon S3 for uploads and Amazon SES for email. GitHub Actions runs CI on every pull request. It deploys when someone pushes a `v*` tag on a commit on `main` that passed CI.

## Deployment

The website is live at [https://cccacommunity.org](https://cccacommunity.org).

## Future plan

- **Course review reminders**: a scheduled job that emails members, through Amazon SES, to review out-of-date course details.
- **News page**: a news collection. This was moved out of scope with the client.
- **Profile-based feature locks**: grey out features until a member completes their profile.
- **Richer course resources**: link resources to course offerings, group them into folders and version them.
- **Better course descriptions**: inline links to resources and optional reflection prompts.
- **Personal dashboard**: one page for a member's courses, proposals, publications, resources and drafts.
- **Collaboration**: an expression-of-interest action on proposals, and discussion threads with moderation tools.
- **Single accounts for admins**: make admin a role on member accounts, not a separate account.
- **More tests**: more end-to-end edge cases and unit tests.
- **Infrastructure as code**: define the AWS resources in code, so that the environment is reproducible and a staging environment is possible.
- **Route 53**: move the domain and DNS from Cloudflare to Amazon Route 53.

## Contributing

Commit messages must follow [Conventional Commits](https://www.conventionalcommits.org/). Commitlint checks this on every commit. Before each commit, Lefthook also runs Biome on the staged files and stages the fixes.
Use the issue templates in `.github/ISSUE_TEMPLATE/` and the PR template in `.github/pull_request_template.md` when opening issues and pull requests.
