import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "course_versions" ADD COLUMN "additional_info" jsonb;
  ALTER TABLE "_course_versions_v" ADD COLUMN "version_additional_info" jsonb;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "course_versions" DROP COLUMN IF EXISTS "additional_info";
  ALTER TABLE "_course_versions_v" DROP COLUMN IF EXISTS "version_additional_info";`)
}
