import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "odberna_mista" ADD COLUMN "zakaznik_text" varchar;
  ALTER TABLE "_odberna_mista_v" ADD COLUMN "version_zakaznik_text" varchar;
  CREATE INDEX "odberna_mista_zakaznik_text_idx" ON "odberna_mista" USING btree ("zakaznik_text");
  CREATE INDEX "_odberna_mista_v_version_version_zakaznik_text_idx" ON "_odberna_mista_v" USING btree ("version_zakaznik_text");`)
  // Dopočet pro OM založená před touto migrací (stejný formát jako zakaznikProHledani()).
  await db.execute(sql`
   UPDATE "odberna_mista" om
   SET "zakaznik_text" = z."nazev" || CASE WHEN z."ico" IS NOT NULL AND z."ico" <> '' THEN ' (IČO ' || z."ico" || ')' ELSE '' END
   FROM "zakaznici" z
   WHERE om."zakaznik_id" = z."id";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "odberna_mista_zakaznik_text_idx";
  DROP INDEX "_odberna_mista_v_version_version_zakaznik_text_idx";
  ALTER TABLE "odberna_mista" DROP COLUMN "zakaznik_text";
  ALTER TABLE "_odberna_mista_v" DROP COLUMN "version_zakaznik_text";`)
}
