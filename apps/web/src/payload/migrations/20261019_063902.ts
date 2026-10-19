import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "email_verification_codes" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"email" varchar NOT NULL,
  	"code_hash" varchar NOT NULL,
  	"sent_at" timestamp(3) with time zone NOT NULL,
  	"expires_at" timestamp(3) with time zone NOT NULL,
  	"attempts" numeric DEFAULT 0 NOT NULL,
  	"sends_in_window" numeric DEFAULT 0 NOT NULL,
  	"window_started_at" timestamp(3) with time zone NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "email_verification_codes_id" integer;
  CREATE UNIQUE INDEX "email_verification_codes_email_idx" ON "email_verification_codes" USING btree ("email");
  CREATE INDEX "email_verification_codes_updated_at_idx" ON "email_verification_codes" USING btree ("updated_at");
  CREATE INDEX "email_verification_codes_created_at_idx" ON "email_verification_codes" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_email_verification_codes_fk" FOREIGN KEY ("email_verification_codes_id") REFERENCES "public"."email_verification_codes"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_email_verification_codes_i_idx" ON "payload_locked_documents_rels" USING btree ("email_verification_codes_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "email_verification_codes" DISABLE ROW LEVEL SECURITY;
  DROP TABLE IF EXISTS "email_verification_codes" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_email_verification_codes_fk";
  
  DROP INDEX IF EXISTS "payload_locked_documents_rels_email_verification_codes_i_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "email_verification_codes_id";`)
}
