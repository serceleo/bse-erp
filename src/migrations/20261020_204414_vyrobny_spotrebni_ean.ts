import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "vyrobny" ADD COLUMN "ean_odberu" varchar;
  ALTER TABLE "_vyrobny_v" ADD COLUMN "version_ean_odberu" varchar;
  CREATE INDEX "vyrobny_ean_odberu_idx" ON "vyrobny" USING btree ("ean_odberu");
  CREATE INDEX "_vyrobny_v_version_version_ean_odberu_idx" ON "_vyrobny_v" USING btree ("version_ean_odberu");`)

  // Doplnění spotřebního EAN u stávajících výroben z jejich OM.
  await db.execute(sql`
   UPDATE "vyrobny" v SET "ean_odberu" = om."kod"
   FROM "odberna_mista" om WHERE om."id" = v."odberne_misto_id";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "vyrobny_ean_odberu_idx";
  DROP INDEX "_vyrobny_v_version_version_ean_odberu_idx";
  ALTER TABLE "vyrobny" DROP COLUMN "ean_odberu";
  ALTER TABLE "_vyrobny_v" DROP COLUMN "version_ean_odberu";`)
}
