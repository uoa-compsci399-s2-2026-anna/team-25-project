import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "members" ADD COLUMN "institution_id" integer NOT NULL;
  ALTER TABLE "members" ADD CONSTRAINT "members_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "members_institution_idx" ON "members" USING btree ("institution_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "members" DROP CONSTRAINT IF EXISTS "members_institution_id_institutions_id_fk";
  
  DROP INDEX IF EXISTS "members_institution_idx";
  ALTER TABLE "members" DROP COLUMN IF EXISTS "institution_id";`)
}
