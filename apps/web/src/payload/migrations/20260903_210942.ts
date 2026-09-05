import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_institutions_country" AS ENUM('AU', 'NZ');
  CREATE TABLE "institutions_domains" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"domain" varchar NOT NULL
  );
  
  CREATE TABLE "institutions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"country" "enum_institutions_country" NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "institutions_id" integer;
  ALTER TABLE "institutions_domains" ADD CONSTRAINT "institutions_domains_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "institutions_domains_order_idx" ON "institutions_domains" USING btree ("_order");
  CREATE INDEX "institutions_domains_parent_id_idx" ON "institutions_domains" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "institutions_name_idx" ON "institutions" USING btree ("name");
  CREATE INDEX "institutions_updated_at_idx" ON "institutions" USING btree ("updated_at");
  CREATE INDEX "institutions_created_at_idx" ON "institutions" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_institutions_fk" FOREIGN KEY ("institutions_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_institutions_id_idx" ON "payload_locked_documents_rels" USING btree ("institutions_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "institutions_domains" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "institutions" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "institutions_domains" CASCADE;
  DROP TABLE "institutions" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_institutions_fk";
  
  DROP INDEX "payload_locked_documents_rels_institutions_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "institutions_id";
  DROP TYPE "public"."enum_institutions_country";`)
}
