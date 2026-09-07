import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_course_versions_delivery_format" AS ENUM('inPerson', 'online', 'hybrid');
  CREATE TYPE "public"."enum_course_versions_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__course_versions_v_version_delivery_format" AS ENUM('inPerson', 'online', 'hybrid');
  CREATE TYPE "public"."enum__course_versions_v_version_status" AS ENUM('draft', 'published');
  CREATE TABLE "courses" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"code" varchar NOT NULL,
  	"institution_id" integer NOT NULL,
  	"owner_id" integer NOT NULL,
  	"has_published_version" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "courses_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"members_id" integer
  );
  
  CREATE TABLE "course_versions_display_snapshot_teaching_team" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"role" varchar
  );
  
  CREATE TABLE "course_versions_teaching_team" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"member_id" integer,
  	"role" varchar
  );
  
  CREATE TABLE "course_versions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"course_id" integer,
  	"period" varchar,
  	"start_date" timestamp(3) with time zone,
  	"end_date" timestamp(3) with time zone,
  	"change_summary" varchar,
  	"published_at" timestamp(3) with time zone,
  	"display_snapshot_course_code" varchar,
  	"display_snapshot_institution_name" varchar,
  	"name" varchar,
  	"programme" varchar,
  	"delivery_format" "enum_course_versions_delivery_format",
  	"project_type" varchar,
  	"learning_outcomes" jsonb,
  	"assessments" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_course_versions_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "course_versions_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"members_id" integer,
  	"admin_id" integer
  );
  
  CREATE TABLE "_course_versions_v_version_display_snapshot_teaching_team" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"role" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_course_versions_v_version_teaching_team" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"member_id" integer,
  	"role" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_course_versions_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_course_id" integer,
  	"version_period" varchar,
  	"version_start_date" timestamp(3) with time zone,
  	"version_end_date" timestamp(3) with time zone,
  	"version_change_summary" varchar,
  	"version_published_at" timestamp(3) with time zone,
  	"version_display_snapshot_course_code" varchar,
  	"version_display_snapshot_institution_name" varchar,
  	"version_name" varchar,
  	"version_programme" varchar,
  	"version_delivery_format" "enum__course_versions_v_version_delivery_format",
  	"version_project_type" varchar,
  	"version_learning_outcomes" jsonb,
  	"version_assessments" jsonb,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__course_versions_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "_course_versions_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"members_id" integer,
  	"admin_id" integer
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "courses_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "course_versions_id" integer;
  ALTER TABLE "courses" ADD CONSTRAINT "courses_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "courses" ADD CONSTRAINT "courses_owner_id_members_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."members"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "courses_rels" ADD CONSTRAINT "courses_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "courses_rels" ADD CONSTRAINT "courses_rels_members_fk" FOREIGN KEY ("members_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "course_versions_display_snapshot_teaching_team" ADD CONSTRAINT "course_versions_display_snapshot_teaching_team_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."course_versions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "course_versions_teaching_team" ADD CONSTRAINT "course_versions_teaching_team_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "course_versions_teaching_team" ADD CONSTRAINT "course_versions_teaching_team_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."course_versions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "course_versions" ADD CONSTRAINT "course_versions_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "course_versions_rels" ADD CONSTRAINT "course_versions_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."course_versions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "course_versions_rels" ADD CONSTRAINT "course_versions_rels_members_fk" FOREIGN KEY ("members_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "course_versions_rels" ADD CONSTRAINT "course_versions_rels_admin_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admin"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_course_versions_v_version_display_snapshot_teaching_team" ADD CONSTRAINT "_course_versions_v_version_display_snapshot_teaching_team_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_course_versions_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_course_versions_v_version_teaching_team" ADD CONSTRAINT "_course_versions_v_version_teaching_team_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_course_versions_v_version_teaching_team" ADD CONSTRAINT "_course_versions_v_version_teaching_team_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_course_versions_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_course_versions_v" ADD CONSTRAINT "_course_versions_v_parent_id_course_versions_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."course_versions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_course_versions_v" ADD CONSTRAINT "_course_versions_v_version_course_id_courses_id_fk" FOREIGN KEY ("version_course_id") REFERENCES "public"."courses"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_course_versions_v_rels" ADD CONSTRAINT "_course_versions_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_course_versions_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_course_versions_v_rels" ADD CONSTRAINT "_course_versions_v_rels_members_fk" FOREIGN KEY ("members_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_course_versions_v_rels" ADD CONSTRAINT "_course_versions_v_rels_admin_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admin"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "courses_institution_idx" ON "courses" USING btree ("institution_id");
  CREATE INDEX "courses_owner_idx" ON "courses" USING btree ("owner_id");
  CREATE INDEX "courses_updated_at_idx" ON "courses" USING btree ("updated_at");
  CREATE INDEX "courses_created_at_idx" ON "courses" USING btree ("created_at");
  CREATE UNIQUE INDEX "institution_code_idx" ON "courses" USING btree ("institution_id","code");
  CREATE INDEX "courses_rels_order_idx" ON "courses_rels" USING btree ("order");
  CREATE INDEX "courses_rels_parent_idx" ON "courses_rels" USING btree ("parent_id");
  CREATE INDEX "courses_rels_path_idx" ON "courses_rels" USING btree ("path");
  CREATE INDEX "courses_rels_members_id_idx" ON "courses_rels" USING btree ("members_id");
  CREATE INDEX "course_versions_display_snapshot_teaching_team_order_idx" ON "course_versions_display_snapshot_teaching_team" USING btree ("_order");
  CREATE INDEX "course_versions_display_snapshot_teaching_team_parent_id_idx" ON "course_versions_display_snapshot_teaching_team" USING btree ("_parent_id");
  CREATE INDEX "course_versions_teaching_team_order_idx" ON "course_versions_teaching_team" USING btree ("_order");
  CREATE INDEX "course_versions_teaching_team_parent_id_idx" ON "course_versions_teaching_team" USING btree ("_parent_id");
  CREATE INDEX "course_versions_teaching_team_member_idx" ON "course_versions_teaching_team" USING btree ("member_id");
  CREATE INDEX "course_versions_course_idx" ON "course_versions" USING btree ("course_id");
  CREATE INDEX "course_versions_start_date_idx" ON "course_versions" USING btree ("start_date");
  CREATE INDEX "course_versions_updated_at_idx" ON "course_versions" USING btree ("updated_at");
  CREATE INDEX "course_versions_created_at_idx" ON "course_versions" USING btree ("created_at");
  CREATE INDEX "course_versions__status_idx" ON "course_versions" USING btree ("_status");
  CREATE INDEX "course_versions_rels_order_idx" ON "course_versions_rels" USING btree ("order");
  CREATE INDEX "course_versions_rels_parent_idx" ON "course_versions_rels" USING btree ("parent_id");
  CREATE INDEX "course_versions_rels_path_idx" ON "course_versions_rels" USING btree ("path");
  CREATE INDEX "course_versions_rels_members_id_idx" ON "course_versions_rels" USING btree ("members_id");
  CREATE INDEX "course_versions_rels_admin_id_idx" ON "course_versions_rels" USING btree ("admin_id");
  CREATE INDEX "_course_versions_v_version_display_snapshot_teaching_team_order_idx" ON "_course_versions_v_version_display_snapshot_teaching_team" USING btree ("_order");
  CREATE INDEX "_course_versions_v_version_display_snapshot_teaching_team_parent_id_idx" ON "_course_versions_v_version_display_snapshot_teaching_team" USING btree ("_parent_id");
  CREATE INDEX "_course_versions_v_version_teaching_team_order_idx" ON "_course_versions_v_version_teaching_team" USING btree ("_order");
  CREATE INDEX "_course_versions_v_version_teaching_team_parent_id_idx" ON "_course_versions_v_version_teaching_team" USING btree ("_parent_id");
  CREATE INDEX "_course_versions_v_version_teaching_team_member_idx" ON "_course_versions_v_version_teaching_team" USING btree ("member_id");
  CREATE INDEX "_course_versions_v_parent_idx" ON "_course_versions_v" USING btree ("parent_id");
  CREATE INDEX "_course_versions_v_version_version_course_idx" ON "_course_versions_v" USING btree ("version_course_id");
  CREATE INDEX "_course_versions_v_version_version_start_date_idx" ON "_course_versions_v" USING btree ("version_start_date");
  CREATE INDEX "_course_versions_v_version_version_updated_at_idx" ON "_course_versions_v" USING btree ("version_updated_at");
  CREATE INDEX "_course_versions_v_version_version_created_at_idx" ON "_course_versions_v" USING btree ("version_created_at");
  CREATE INDEX "_course_versions_v_version_version__status_idx" ON "_course_versions_v" USING btree ("version__status");
  CREATE INDEX "_course_versions_v_created_at_idx" ON "_course_versions_v" USING btree ("created_at");
  CREATE INDEX "_course_versions_v_updated_at_idx" ON "_course_versions_v" USING btree ("updated_at");
  CREATE INDEX "_course_versions_v_latest_idx" ON "_course_versions_v" USING btree ("latest");
  CREATE INDEX "_course_versions_v_rels_order_idx" ON "_course_versions_v_rels" USING btree ("order");
  CREATE INDEX "_course_versions_v_rels_parent_idx" ON "_course_versions_v_rels" USING btree ("parent_id");
  CREATE INDEX "_course_versions_v_rels_path_idx" ON "_course_versions_v_rels" USING btree ("path");
  CREATE INDEX "_course_versions_v_rels_members_id_idx" ON "_course_versions_v_rels" USING btree ("members_id");
  CREATE INDEX "_course_versions_v_rels_admin_id_idx" ON "_course_versions_v_rels" USING btree ("admin_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_courses_fk" FOREIGN KEY ("courses_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_course_versions_fk" FOREIGN KEY ("course_versions_id") REFERENCES "public"."course_versions"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_courses_id_idx" ON "payload_locked_documents_rels" USING btree ("courses_id");
  CREATE INDEX "payload_locked_documents_rels_course_versions_id_idx" ON "payload_locked_documents_rels" USING btree ("course_versions_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "courses" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "courses_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "course_versions_display_snapshot_teaching_team" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "course_versions_teaching_team" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "course_versions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "course_versions_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_course_versions_v_version_display_snapshot_teaching_team" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_course_versions_v_version_teaching_team" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_course_versions_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_course_versions_v_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "courses" CASCADE;
  DROP TABLE "courses_rels" CASCADE;
  DROP TABLE "course_versions_display_snapshot_teaching_team" CASCADE;
  DROP TABLE "course_versions_teaching_team" CASCADE;
  DROP TABLE "course_versions" CASCADE;
  DROP TABLE "course_versions_rels" CASCADE;
  DROP TABLE "_course_versions_v_version_display_snapshot_teaching_team" CASCADE;
  DROP TABLE "_course_versions_v_version_teaching_team" CASCADE;
  DROP TABLE "_course_versions_v" CASCADE;
  DROP TABLE "_course_versions_v_rels" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_courses_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_course_versions_fk";
  
  DROP INDEX "payload_locked_documents_rels_courses_id_idx";
  DROP INDEX "payload_locked_documents_rels_course_versions_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "courses_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "course_versions_id";
  DROP TYPE "public"."enum_course_versions_delivery_format";
  DROP TYPE "public"."enum_course_versions_status";
  DROP TYPE "public"."enum__course_versions_v_version_delivery_format";
  DROP TYPE "public"."enum__course_versions_v_version_status";`)
}
