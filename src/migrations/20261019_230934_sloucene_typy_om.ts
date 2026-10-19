import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."om_typ" AS ENUM('Z', 'V', 'Z-S', 'V-S');
  ALTER TABLE "odberna_mista" ADD COLUMN "typ" "om_typ";
  ALTER TABLE "_odberna_mista_v" ADD COLUMN "version_typ" "om_typ";
  CREATE INDEX "odberna_mista_typ_idx" ON "odberna_mista" USING btree ("typ");
  CREATE INDEX "_odberna_mista_v_version_version_typ_idx" ON "_odberna_mista_v" USING btree ("version_typ");`)

  // Dopočet sloučeného typu pro OM založená před touto migrací (stejné pravidlo jako typOM()).
  await db.execute(sql`
   UPDATE "odberna_mista" SET "typ" = (
     CASE WHEN "typ_zakaznika"::text = 'virtualni' THEN 'V' ELSE 'Z' END ||
     CASE WHEN "spotrebitel"::text = 'ano' THEN '-S' ELSE '' END
   )::"om_typ"
   WHERE "typ_zakaznika" IS NOT NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "odberna_mista_typ_idx";
  DROP INDEX "_odberna_mista_v_version_version_typ_idx";
  ALTER TABLE "odberna_mista" DROP COLUMN "typ";
  ALTER TABLE "_odberna_mista_v" DROP COLUMN "version_typ";
  DROP TYPE "public"."om_typ";`)
}
