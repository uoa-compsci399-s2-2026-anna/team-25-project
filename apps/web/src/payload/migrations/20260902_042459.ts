import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "admin_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "admin" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"first_name" varchar NOT NULL,
  	"last_name" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "members_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "members" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"first_name" varchar NOT NULL,
  	"last_name" varchar NOT NULL,
  	"position" varchar,
  	"bio" varchar,
  	"avatar_id" integer,
  	"show_email_publicly" boolean DEFAULT false,
  	"last_reviewed_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  ALTER TABLE "users_sessions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "users" DISABLE ROW LEVEL SECURITY;
  DROP TABLE IF EXISTS "users_sessions" CASCADE;
  DROP TABLE IF EXISTS "users" CASCADE;
  DROP INDEX IF EXISTS "payload_locked_documents_rels_users_id_idx";
  DROP INDEX IF EXISTS "payload_preferences_rels_users_id_idx";
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "admin_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "members_id" integer;
  ALTER TABLE "payload_preferences_rels" ADD COLUMN "admin_id" integer;
  ALTER TABLE "payload_preferences_rels" ADD COLUMN "members_id" integer;
  ALTER TABLE "admin_sessions" ADD CONSTRAINT "admin_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."admin"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "members_sessions" ADD CONSTRAINT "members_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "members" ADD CONSTRAINT "members_avatar_id_media_id_fk" FOREIGN KEY ("avatar_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "admin_sessions_order_idx" ON "admin_sessions" USING btree ("_order");
  CREATE INDEX "admin_sessions_parent_id_idx" ON "admin_sessions" USING btree ("_parent_id");
  CREATE INDEX "admin_updated_at_idx" ON "admin" USING btree ("updated_at");
  CREATE INDEX "admin_created_at_idx" ON "admin" USING btree ("created_at");
  CREATE UNIQUE INDEX "admin_email_idx" ON "admin" USING btree ("email");
  CREATE INDEX "members_sessions_order_idx" ON "members_sessions" USING btree ("_order");
  CREATE INDEX "members_sessions_parent_id_idx" ON "members_sessions" USING btree ("_parent_id");
  CREATE INDEX "members_avatar_idx" ON "members" USING btree ("avatar_id");
  CREATE INDEX "members_updated_at_idx" ON "members" USING btree ("updated_at");
  CREATE INDEX "members_created_at_idx" ON "members" USING btree ("created_at");
  CREATE UNIQUE INDEX "members_email_idx" ON "members" USING btree ("email");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_admin_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admin"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_members_fk" FOREIGN KEY ("members_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_admin_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admin"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_members_fk" FOREIGN KEY ("members_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_admin_id_idx" ON "payload_locked_documents_rels" USING btree ("admin_id");
  CREATE INDEX "payload_locked_documents_rels_members_id_idx" ON "payload_locked_documents_rels" USING btree ("members_id");
  CREATE INDEX "payload_preferences_rels_admin_id_idx" ON "payload_preferences_rels" USING btree ("admin_id");
  CREATE INDEX "payload_preferences_rels_members_id_idx" ON "payload_preferences_rels" USING btree ("members_id");
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "users_id";
  ALTER TABLE "payload_preferences_rels" DROP COLUMN IF EXISTS "users_id";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  ALTER TABLE "admin_sessions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "admin" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "members_sessions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "members" DISABLE ROW LEVEL SECURITY;
  DROP TABLE IF EXISTS "admin_sessions" CASCADE;
  DROP TABLE IF EXISTS "admin" CASCADE;
  DROP TABLE IF EXISTS "members_sessions" CASCADE;
  DROP TABLE IF EXISTS "members" CASCADE;
  DROP INDEX IF EXISTS "payload_locked_documents_rels_admin_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_members_id_idx";
  DROP INDEX IF EXISTS "payload_preferences_rels_admin_id_idx";
  DROP INDEX IF EXISTS "payload_preferences_rels_members_id_idx";
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "users_id" integer;
  ALTER TABLE "payload_preferences_rels" ADD COLUMN "users_id" integer;
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "admin_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "members_id";
  ALTER TABLE "payload_preferences_rels" DROP COLUMN IF EXISTS "admin_id";
  ALTER TABLE "payload_preferences_rels" DROP COLUMN IF EXISTS "members_id";`)
}
