import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "course_versions_display_snapshot_teaching_team" ADD COLUMN "member_id" numeric;
  ALTER TABLE "_course_versions_v_version_display_snapshot_teaching_team" ADD COLUMN "member_id" numeric;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "course_versions_display_snapshot_teaching_team" DROP COLUMN IF EXISTS "member_id";
  ALTER TABLE "_course_versions_v_version_display_snapshot_teaching_team" DROP COLUMN IF EXISTS "member_id";`)
}
