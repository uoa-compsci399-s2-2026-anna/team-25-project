import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "institutions" ADD COLUMN "logo_id" integer;
  ALTER TABLE "institutions" ADD COLUMN "show_logo" boolean DEFAULT true;
  ALTER TABLE "institutions" ADD CONSTRAINT "institutions_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "institutions_logo_idx" ON "institutions" USING btree ("logo_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "institutions" DROP CONSTRAINT IF EXISTS "institutions_logo_id_media_id_fk";
  
  DROP INDEX IF EXISTS "institutions_logo_idx";
  ALTER TABLE "institutions" DROP COLUMN IF EXISTS "logo_id";
  ALTER TABLE "institutions" DROP COLUMN IF EXISTS "show_logo";`)
}
