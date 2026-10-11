import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  // Hand-edited: backfill known institutions. The rest keep the column default of 0,0,
  // which the globe query treats as no location.
  await db.execute(sql`
   ALTER TABLE "institutions" ADD COLUMN "location_latitude" numeric DEFAULT 0 NOT NULL;
  ALTER TABLE "institutions" ADD COLUMN "location_longitude" numeric DEFAULT 0 NOT NULL;
  UPDATE "institutions" AS i SET "location_latitude" = v.lat, "location_longitude" = v.lng
  FROM (VALUES
    ('University of Auckland', -36.8523, 174.769),
    ('University of Otago', -45.8655, 170.5145),
    ('University of Melbourne', -37.7963, 144.9612),
    ('UNSW Sydney', -33.9173, 151.2313)
  ) AS v(name, lat, lng)
  WHERE i."name" = v.name;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "institutions" DROP COLUMN IF EXISTS "location_latitude";
  ALTER TABLE "institutions" DROP COLUMN IF EXISTS "location_longitude";`)
}
