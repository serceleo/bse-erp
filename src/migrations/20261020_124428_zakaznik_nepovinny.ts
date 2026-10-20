import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "odberna_mista" ALTER COLUMN "zakaznik_id" DROP NOT NULL;
  ALTER TABLE "_odberna_mista_v" ALTER COLUMN "version_zakaznik_id" DROP NOT NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "odberna_mista" ALTER COLUMN "zakaznik_id" SET NOT NULL;
  ALTER TABLE "_odberna_mista_v" ALTER COLUMN "version_zakaznik_id" SET NOT NULL;`)
}
