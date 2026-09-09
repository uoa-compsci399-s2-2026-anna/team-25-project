import { describe, expect, it } from "vitest"
import { hardenMigration } from "./harden-migration"

/** Wraps `down` SQL in the shape Payload generates, with an `up` block before it. */
const migration = (
  upSql: string,
  downSql: string,
) => `import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql\`
  ${upSql}\`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql\`
  ${downSql}\`)
}
`

describe("hardenMigration", () => {
  it("guards each drop form Payload emits", () => {
    const drops = [
      'DROP TABLE "courses" CASCADE;',
      'ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "rels_courses_fk";',
      'DROP INDEX "rels_courses_id_idx";',
      'ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "courses_id";',
      'DROP TYPE "public"."enum_course_versions_status";',
    ].join("\n  ")
    const guarded = [
      'DROP TABLE IF EXISTS "courses" CASCADE;',
      'ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "rels_courses_fk";',
      'DROP INDEX IF EXISTS "rels_courses_id_idx";',
      'ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "courses_id";',
      'DROP TYPE IF EXISTS "public"."enum_course_versions_status";',
    ].join("\n  ")

    expect(hardenMigration(migration("SELECT 1;", drops))).toBe(migration("SELECT 1;", guarded))
  })

  it("leaves drops in the up block unguarded", () => {
    const source = migration('DROP TABLE "users" CASCADE;', 'DROP TABLE "courses" CASCADE;')

    expect(hardenMigration(source)).toBe(
      migration('DROP TABLE "users" CASCADE;', 'DROP TABLE IF EXISTS "courses" CASCADE;'),
    )
  })

  it("leaves a file without a down block unchanged", () => {
    const source = 'export async function up() {\n  DROP TABLE "courses" CASCADE;\n}\n'

    expect(hardenMigration(source)).toBe(source)
  })

  it("leaves already guarded drops alone", () => {
    const source = migration("SELECT 1;", 'DROP INDEX IF EXISTS "members_institution_idx";')

    expect(hardenMigration(source)).toBe(source)
  })

  it("is idempotent", () => {
    const once = hardenMigration(migration("SELECT 1;", 'DROP TABLE "courses" CASCADE;'))

    expect(hardenMigration(once)).toBe(once)
  })

  it("leaves drop clauses that reject IF EXISTS alone", () => {
    const source = migration(
      "SELECT 1;",
      [
        'ALTER TABLE "courses" ALTER COLUMN "slug" DROP NOT NULL;',
        'ALTER TABLE "courses" ALTER COLUMN "slug" DROP DEFAULT;',
      ].join("\n  "),
    )

    expect(hardenMigration(source)).toBe(source)
  })
})
