import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "odberna_mista" ADD COLUMN "spotrebitel_rucne" boolean DEFAULT false;
  ALTER TABLE "_odberna_mista_v" ADD COLUMN "version_spotrebitel_rucne" boolean DEFAULT false;`)

  // Dopočet pro OM s přiřazeným zákazníkem (stejné pravidlo jako jeSpotrebitel() + typOM()).
  await db.execute(sql`
   UPDATE "odberna_mista" om
   SET "spotrebitel" = (CASE WHEN z."typ_subjektu"::text IN ('fo', 'fop')
                              AND om."typ_odberu"::text IN ('NN', 'MO')
                             THEN 'ano' ELSE 'ne' END)::"enum_odberna_mista_spotrebitel"
   FROM "zakaznici" z WHERE z."id" = om."zakaznik_id";

   UPDATE "odberna_mista"
   SET "typ" = ((CASE WHEN "typ_zakaznika"::text = 'virtualni' THEN 'V' ELSE 'Z' END)
                || (CASE WHEN "spotrebitel"::text = 'ano' THEN '-S' ELSE '' END))::"om_typ"
   WHERE "typ_zakaznika" IS NOT NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "odberna_mista" DROP COLUMN "spotrebitel_rucne";
  ALTER TABLE "_odberna_mista_v" DROP COLUMN "version_spotrebitel_rucne";`)
}
