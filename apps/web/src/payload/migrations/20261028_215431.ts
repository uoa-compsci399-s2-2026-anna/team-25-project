import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "members" ADD COLUMN "department" varchar;
  ALTER TABLE "members" ADD COLUMN "faculty" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "members" DROP COLUMN IF EXISTS "department";
  ALTER TABLE "members" DROP COLUMN IF EXISTS "faculty";`)
}
