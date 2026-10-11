import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "resource_attachments" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"prefix" varchar DEFAULT 'resourceAttachments',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "resource_attachments_id" integer;
  CREATE INDEX "resource_attachments_updated_at_idx" ON "resource_attachments" USING btree ("updated_at");
  CREATE INDEX "resource_attachments_created_at_idx" ON "resource_attachments" USING btree ("created_at");
  CREATE UNIQUE INDEX "resource_attachments_filename_idx" ON "resource_attachments" USING btree ("filename");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_resource_attachments_fk" FOREIGN KEY ("resource_attachments_id") REFERENCES "public"."resource_attachments"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_resource_attachments_id_idx" ON "payload_locked_documents_rels" USING btree ("resource_attachments_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "resource_attachments" DISABLE ROW LEVEL SECURITY;
  DROP TABLE IF EXISTS "resource_attachments" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_resource_attachments_fk";
  
  DROP INDEX IF EXISTS "payload_locked_documents_rels_resource_attachments_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "resource_attachments_id";`)
}
