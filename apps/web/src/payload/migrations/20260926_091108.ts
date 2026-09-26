import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_members_title" AS ENUM('dr', 'prof', 'assocProf', 'mr', 'ms', 'mrs', 'mx');
  CREATE TABLE "members_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"url" varchar NOT NULL
  );
  
  CREATE TABLE "members_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  UPDATE "members" SET "position" = '' WHERE "position" IS NULL;
  ALTER TABLE "members" ALTER COLUMN "position" SET NOT NULL;
  ALTER TABLE "members" ADD COLUMN "title" "enum_members_title";
  ALTER TABLE "members_links" ADD CONSTRAINT "members_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "members_texts" ADD CONSTRAINT "members_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "members_links_order_idx" ON "members_links" USING btree ("_order");
  CREATE INDEX "members_links_parent_id_idx" ON "members_links" USING btree ("_parent_id");
  CREATE INDEX "members_texts_order_parent" ON "members_texts" USING btree ("order","parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "members_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "members_texts" DISABLE ROW LEVEL SECURITY;
  DROP TABLE IF EXISTS "members_links" CASCADE;
  DROP TABLE IF EXISTS "members_texts" CASCADE;
  ALTER TABLE "members" ALTER COLUMN "position" DROP NOT NULL;
  ALTER TABLE "members" DROP COLUMN IF EXISTS "title";
  DROP TYPE IF EXISTS "public"."enum_members_title";`)
}
