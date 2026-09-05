import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_proposals_tags" AS ENUM('assessment', 'quantitative', 'qualitative', 'teamwork', 'industry', 'curriculum', 'generativeAi', 'ethics');
  CREATE TYPE "public"."enum_proposals_timeframe_start_period" AS ENUM('sem1', 'sem2', 'summer');
  CREATE TYPE "public"."enum_proposals_timeframe_end_period" AS ENUM('early', 'mid', 'late');
  CREATE TYPE "public"."enum_proposals_ethics" AS ENUM('unknown', 'notRequired', 'approved', 'amendmentNeeded', 'newApplicationNeeded');
  CREATE TYPE "public"."enum_proposals_status" AS ENUM('active', 'closed');
  CREATE TABLE "proposals_tags" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_proposals_tags",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "proposals" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"proposal_slug" varchar,
  	"summary" varchar NOT NULL,
  	"body" jsonb NOT NULL,
  	"timeframe_start_year" numeric NOT NULL,
  	"timeframe_start_period" "enum_proposals_timeframe_start_period" NOT NULL,
  	"timeframe_end_year" numeric,
  	"timeframe_end_period" "enum_proposals_timeframe_end_period",
  	"output_target" varchar,
  	"ethics" "enum_proposals_ethics" DEFAULT 'unknown' NOT NULL,
  	"status" "enum_proposals_status" DEFAULT 'active' NOT NULL,
  	"closed_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "proposals_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"members_id" integer
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "proposals_id" integer;
  ALTER TABLE "proposals_tags" ADD CONSTRAINT "proposals_tags_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."proposals"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "proposals_rels" ADD CONSTRAINT "proposals_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."proposals"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "proposals_rels" ADD CONSTRAINT "proposals_rels_members_fk" FOREIGN KEY ("members_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "proposals_tags_order_idx" ON "proposals_tags" USING btree ("order");
  CREATE INDEX "proposals_tags_parent_idx" ON "proposals_tags" USING btree ("parent_id");
  CREATE INDEX "proposals_updated_at_idx" ON "proposals" USING btree ("updated_at");
  CREATE INDEX "proposals_created_at_idx" ON "proposals" USING btree ("created_at");
  CREATE INDEX "proposals_rels_order_idx" ON "proposals_rels" USING btree ("order");
  CREATE INDEX "proposals_rels_parent_idx" ON "proposals_rels" USING btree ("parent_id");
  CREATE INDEX "proposals_rels_path_idx" ON "proposals_rels" USING btree ("path");
  CREATE INDEX "proposals_rels_members_id_idx" ON "proposals_rels" USING btree ("members_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_proposals_fk" FOREIGN KEY ("proposals_id") REFERENCES "public"."proposals"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_proposals_id_idx" ON "payload_locked_documents_rels" USING btree ("proposals_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "proposals_tags" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "proposals" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "proposals_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "proposals_tags" CASCADE;
  DROP TABLE "proposals" CASCADE;
  DROP TABLE "proposals_rels" CASCADE;
  
  DROP INDEX "payload_locked_documents_rels_proposals_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "proposals_id";
  DROP TYPE "public"."enum_proposals_tags";
  DROP TYPE "public"."enum_proposals_timeframe_start_period";
  DROP TYPE "public"."enum_proposals_timeframe_end_period";
  DROP TYPE "public"."enum_proposals_ethics";
  DROP TYPE "public"."enum_proposals_status";`)
}
