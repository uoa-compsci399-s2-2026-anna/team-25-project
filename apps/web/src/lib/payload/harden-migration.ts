/**
 * Payload generates `down` SQL that drops constraints, indexes, columns and
 * types unconditionally. `DROP TABLE ... CASCADE` earlier in the same block
 * already removes the foreign keys and indexes that reference those tables, so
 * the later explicit drops fail with "constraint does not exist" and take the
 * whole rollback down with them.
 *
 * Adding `IF EXISTS` to every drop in `down` makes a rollback idempotent
 * without changing what it removes. Run it over every newly generated migration
 * (`pnpm migrate:create` does this automatically).
 *
 * `up` is left alone on purpose. A forward drop that finds nothing means the
 * schema has drifted from what the migration expects, and that must fail loudly
 * instead of passing and leaving later statements to fail somewhere else.
 */

/**
 * The `down` function and everything after it. Payload always emits `up` first,
 * so taking the rest of the file needs no brace matching. A file without a
 * `down` function is left unchanged.
 */
const DOWN_BLOCK = /export\s+async\s+function\s+down\b[\s\S]*$/

/** Drop forms that accept `IF EXISTS` and that Payload emits without it. */
const DROP_STATEMENTS =
  /\b(DROP\s+(?:TABLE|CONSTRAINT|INDEX|COLUMN|TYPE|VIEW|SEQUENCE))\s+(?!IF\s+EXISTS\b)/gi

/** Rewrites unguarded drops in the `down` block of `source`. Idempotent. */
export const hardenMigration = (source: string): string =>
  source.replace(DOWN_BLOCK, (block) =>
    block.replace(DROP_STATEMENTS, (_match, statement: string) => `${statement} IF EXISTS `),
  )
