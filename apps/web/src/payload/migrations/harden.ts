/**
 * Rewrites unguarded drops in the generated migrations to `DROP ... IF EXISTS`,
 * so `pnpm migrate:down` never fails on an object a `CASCADE` already removed.
 *
 * `pnpm migrate:create` runs this straight after Payload writes the migration.
 * Running it by hand over the whole directory is safe: it is idempotent and
 * only rewrites files it actually changes.
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { hardenMigration } from "@/lib/payload/harden-migration"

const MIGRATIONS_DIR = join(import.meta.dirname, ".")

const harden = () => {
  const migrations = readdirSync(MIGRATIONS_DIR).filter(
    (file) => file.endsWith(".ts") && file !== "index.ts" && file !== "harden.ts",
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
