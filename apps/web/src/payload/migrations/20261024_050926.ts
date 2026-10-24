import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "course_versions" DROP COLUMN "change_summary";
  ALTER TABLE "_course_versions_v" DROP COLUMN "version_change_summary";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "course_versions" ADD COLUMN "change_summary" varchar;
  ALTER TABLE "_course_versions_v" ADD COLUMN "version_change_summary" varchar;`)
}
