import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "odberna_mista" DROP COLUMN "parametry_v_n_rezervovana_kapacita_kw";
  ALTER TABLE "_odberna_mista_v" DROP COLUMN "version_parametry_v_n_rezervovana_kapacita_kw";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "odberna_mista" ADD COLUMN "parametry_v_n_rezervovana_kapacita_kw" numeric;
  ALTER TABLE "_odberna_mista_v" ADD COLUMN "version_parametry_v_n_rezervovana_kapacita_kw" numeric;`)
}
