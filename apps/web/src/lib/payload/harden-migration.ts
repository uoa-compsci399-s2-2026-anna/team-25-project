/**
 * Payload generates `down` SQL that drops constraints, indexes, columns and
 * types unconditionally. `DROP TABLE ... CASCADE` earlier in the same block
 * already removes the foreign keys and indexes that reference those tables, so
 * the later explicit drops fail with "constraint does not exist" and take the
 * whole rollback down with them.
 *
 * Adding `IF EXISTS` to every drop makes a rollback idempotent without changing
 * what it removes. Run it over every newly generated migration
 * (`pnpm migrate:create` does this automatically).
 */

/** Drop forms that accept `IF EXISTS` and that Payload emits without it. */
const DROP_STATEMENTS =
  /\b(DROP\s+(?:TABLE|CONSTRAINT|INDEX|COLUMN|TYPE|VIEW|SEQUENCE))\s+(?!IF\s+EXISTS\b)/gi

/** Rewrites unguarded drops in `source` to `DROP ... IF EXISTS`. Idempotent. */
export const hardenMigration = (source: string): string =>
  source.replace(DROP_STATEMENTS, (_match, statement: string) => `${statement} IF EXISTS `)
