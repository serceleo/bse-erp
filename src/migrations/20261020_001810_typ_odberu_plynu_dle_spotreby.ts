import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "odberna_mista" ALTER COLUMN "typ_odberu" DROP NOT NULL;
  ALTER TABLE "_odberna_mista_v" ALTER COLUMN "version_typ_odberu" DROP NOT NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "odberna_mista" ALTER COLUMN "typ_odberu" SET NOT NULL;
  ALTER TABLE "_odberna_mista_v" ALTER COLUMN "version_typ_odberu" SET NOT NULL;`)
}
