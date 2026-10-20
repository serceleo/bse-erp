import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "odberna_mista" ADD COLUMN "typ_odberu_rucne" boolean DEFAULT false;
  ALTER TABLE "_odberna_mista_v" ADD COLUMN "version_typ_odberu_rucne" boolean DEFAULT false;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "odberna_mista" DROP COLUMN "typ_odberu_rucne";
  ALTER TABLE "_odberna_mista_v" DROP COLUMN "version_typ_odberu_rucne";`)
}
