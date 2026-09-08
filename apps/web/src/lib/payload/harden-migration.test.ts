import { describe, expect, it } from "vitest"
import { hardenMigration } from "./harden-migration"

describe("hardenMigration", () => {
  it("guards each drop form Payload emits", () => {
    const source = [
      'DROP TABLE "courses" CASCADE;',
      'ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "rels_courses_fk";',
      'DROP INDEX "rels_courses_id_idx";',
      'ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "courses_id";',
      'DROP TYPE "public"."enum_course_versions_status";',
    ].join("\n")

    expect(hardenMigration(source)).toBe(
      [
        'DROP TABLE IF EXISTS "courses" CASCADE;',
        'ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "rels_courses_fk";',
        'DROP INDEX IF EXISTS "rels_courses_id_idx";',
        'ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "courses_id";',
        'DROP TYPE IF EXISTS "public"."enum_course_versions_status";',
      ].join("\n"),
    )
  })

  it("leaves already guarded drops alone", () => {
    const source = 'DROP INDEX IF EXISTS "members_institution_idx";'

    expect(hardenMigration(source)).toBe(source)
  })

  it("is idempotent", () => {
    const source = 'DROP TABLE "courses" CASCADE;'

    expect(hardenMigration(hardenMigration(source))).toBe(hardenMigration(source))
  })

  it("ignores statements that are not drops", () => {
    const source = 'ALTER TABLE "courses" DISABLE ROW LEVEL SECURITY;'

    expect(hardenMigration(source)).toBe(source)
  })
})
