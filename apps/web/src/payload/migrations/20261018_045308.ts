import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  // Hand-edited: backfills term and year from the free-text period, then creates
  // the unique index once every row has them. Only the two formats the app has
  // written are parsed ("2026 Semester 2" and "Semester 2, 2026"). Anything else
  // is left unset rather than guessed at - fine for a draft, which may lack a
  // period - and a published offering left unset aborts the migration.
  // Character classes rather than \s and \d: this template is cooked, so a
  // backslash escape would reach Postgres without its backslash.
  await db.execute(sql`
   CREATE TYPE "public"."enum_course_versions_term" AS ENUM('summerSchool', 'semester1', 'semester2', 'fullYear');
  CREATE TYPE "public"."enum__course_versions_v_version_term" AS ENUM('summerSchool', 'semester1', 'semester2', 'fullYear');
  ALTER TABLE "course_versions" ADD COLUMN "term" "enum_course_versions_term";
  ALTER TABLE "course_versions" ADD COLUMN "year" numeric;
  ALTER TABLE "_course_versions_v" ADD COLUMN "version_term" "enum__course_versions_v_version_term";
  ALTER TABLE "_course_versions_v" ADD COLUMN "version_year" numeric;
  CREATE INDEX "version_course_version_year_version_term_idx" ON "_course_versions_v" USING btree ("version_course_id","version_year","version_term");

  CREATE FUNCTION pg_temp.parse_course_period(period text, OUT term text, OUT year numeric) AS $fn$
    SELECT
      CASE lower(coalesce(year_first[2], term_first[1]))
        WHEN 'summer school' THEN 'summerSchool'
        WHEN 'semester 1' THEN 'semester1'
        WHEN 'semester 2' THEN 'semester2'
        WHEN 'full year' THEN 'fullYear'
      END,
      coalesce(year_first[1], term_first[2])::numeric
    FROM (
      SELECT
        regexp_match(period, '^[[:space:]]*([0-9]{4})[[:space:]]+(summer school|semester [12]|full year)[[:space:]]*$', 'i') AS year_first,
        regexp_match(period, '^[[:space:]]*(summer school|semester [12]|full year),?[[:space:]]+([0-9]{4})[[:space:]]*$', 'i') AS term_first
    ) AS matched
    WHERE coalesce(year_first[1], term_first[2])::numeric BETWEEN 2000 AND 2100
  $fn$ LANGUAGE sql IMMUTABLE;

  CREATE FUNCTION pg_temp.course_period_label(term text, year numeric) RETURNS text AS $fn$
    SELECT CASE term
      WHEN 'summerSchool' THEN 'Summer School'
      WHEN 'semester1' THEN 'Semester 1'
      WHEN 'semester2' THEN 'Semester 2'
      WHEN 'fullYear' THEN 'Full Year'
    END || ' ' || year
  $fn$ LANGUAGE sql IMMUTABLE;

  UPDATE "course_versions" AS cv
  SET "term" = parsed.term::"enum_course_versions_term",
    "year" = parsed.year,
    "period" = pg_temp.course_period_label(parsed.term, parsed.year)
  FROM "course_versions" AS source, pg_temp.parse_course_period(source."period") AS parsed
  WHERE cv."id" = source."id" AND parsed.term IS NOT NULL;

  -- Revisions are history, so an unparseable one is left as it was, never fatal.
  UPDATE "_course_versions_v" AS v
  SET "version_term" = parsed.term::"enum__course_versions_v_version_term",
    "version_year" = parsed.year,
    "version_period" = pg_temp.course_period_label(parsed.term, parsed.year)
  FROM "_course_versions_v" AS source, pg_temp.parse_course_period(source."version_period") AS parsed
  WHERE v."id" = source."id" AND parsed.term IS NOT NULL;

  DO $check$
  DECLARE unparsed text;
  BEGIN
    SELECT string_agg(format('#%s (%L)', "id", "period"), ', ' ORDER BY "id") INTO unparsed
    FROM "course_versions"
    WHERE "_status" = 'published' AND ("term" IS NULL OR "year" IS NULL);
    IF unparsed IS NOT NULL THEN
      RAISE EXCEPTION 'Cannot derive a term and year for published offerings %. Set each period to "<year> <term>" (e.g. "2026 Semester 2") and migrate again.', unparsed;
    END IF;
  END
  $check$;

  DROP FUNCTION pg_temp.parse_course_period(text);
  DROP FUNCTION pg_temp.course_period_label(text, numeric);

  CREATE UNIQUE INDEX "course_year_term_idx" ON "course_versions" USING btree ("course_id","year","term");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX IF EXISTS "course_year_term_idx";
  DROP INDEX IF EXISTS "version_course_version_year_version_term_idx";
  ALTER TABLE "course_versions" DROP COLUMN IF EXISTS "term";
  ALTER TABLE "course_versions" DROP COLUMN IF EXISTS "year";
  ALTER TABLE "_course_versions_v" DROP COLUMN IF EXISTS "version_term";
  ALTER TABLE "_course_versions_v" DROP COLUMN IF EXISTS "version_year";
  DROP TYPE IF EXISTS "public"."enum_course_versions_term";
  DROP TYPE IF EXISTS "public"."enum__course_versions_v_version_term";`)
}
