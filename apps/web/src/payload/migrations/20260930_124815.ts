import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_publications_type" AS ENUM('article', 'book', 'booklet', 'inbook', 'incollection', 'inproceedings', 'manual', 'mastersthesis', 'phdthesis', 'proceedings', 'techreport', 'unpublished', 'misc');
  CREATE TABLE "publications_authors" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"member_id" integer
  );
  
  CREATE TABLE "publications" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"citation_key" varchar,
  	"type" "enum_publications_type" DEFAULT 'article' NOT NULL,
  	"title" varchar NOT NULL,
  	"year" numeric NOT NULL,
  	"month" numeric,
  	"doi" varchar,
  	"url" varchar,
  	"venue" varchar,
  	"volume" varchar,
  	"issue" varchar,
  	"pages" varchar,
  	"publisher" varchar,
  	"abstract" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "publications_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "publications_id" integer;
  ALTER TABLE "publications_authors" ADD CONSTRAINT "publications_authors_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "publications_authors" ADD CONSTRAINT "publications_authors_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."publications"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "publications_texts" ADD CONSTRAINT "publications_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."publications"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "publications_authors_order_idx" ON "publications_authors" USING btree ("_order");
  CREATE INDEX "publications_authors_parent_id_idx" ON "publications_authors" USING btree ("_parent_id");
  CREATE INDEX "publications_authors_member_idx" ON "publications_authors" USING btree ("member_id");
  CREATE UNIQUE INDEX "publications_citation_key_idx" ON "publications" USING btree ("citation_key");
  CREATE UNIQUE INDEX "publications_doi_idx" ON "publications" USING btree ("doi");
  CREATE INDEX "publications_updated_at_idx" ON "publications" USING btree ("updated_at");
  CREATE INDEX "publications_created_at_idx" ON "publications" USING btree ("created_at");
  CREATE INDEX "publications_texts_order_parent" ON "publications_texts" USING btree ("order","parent_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_publications_fk" FOREIGN KEY ("publications_id") REFERENCES "public"."publications"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_publications_id_idx" ON "payload_locked_documents_rels" USING btree ("publications_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "publications_authors" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "publications" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "publications_texts" DISABLE ROW LEVEL SECURITY;
  DROP TABLE IF EXISTS "publications_authors" CASCADE;
  DROP TABLE IF EXISTS "publications" CASCADE;
  DROP TABLE IF EXISTS "publications_texts" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_publications_fk";
  
  DROP INDEX IF EXISTS "payload_locked_documents_rels_publications_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "publications_id";
  DROP TYPE IF EXISTS "public"."enum_publications_type";`)
}
