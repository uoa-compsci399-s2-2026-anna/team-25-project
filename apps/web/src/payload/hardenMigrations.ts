/**
 * Rewrites unguarded drops in the generated migrations to `DROP ... IF EXISTS`,
 * so `pnpm migrate:down` never fails on an object a `CASCADE` already removed.
 * Only the `down` block is rewritten; see `harden-migration.ts` for why.
 *
 * `pnpm migrate:create` runs this straight after Payload writes the migration.
 * Running it by hand over the whole directory is safe: it is idempotent and
 * only rewrites files it actually changes.
 *
 * This file must live outside `migrations/`: Payload's `migrate` command scans
 * every `.ts` file in that directory (except `index.ts`) and runs it as a
 * migration, so a helper script placed in there breaks `pnpm migrate`.
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { hardenMigration } from "@/lib/payload/harden-migration"

const MIGRATIONS_DIR = join(import.meta.dirname, "migrations")

const harden = () => {
  const migrations = readdirSync(MIGRATIONS_DIR).filter(
    (file) => file.endsWith(".ts") && file !== "index.ts",
  )

  for (const file of migrations) {
    const path = join(MIGRATIONS_DIR, file)
    const source = readFileSync(path, "utf8")
    const hardened = hardenMigration(source)

    if (hardened !== source) {
      writeFileSync(path, hardened)
      console.info(`Guarded drops in ${file}.`)
    }
  }
}

harden()
