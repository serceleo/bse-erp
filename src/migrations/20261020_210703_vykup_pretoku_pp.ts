import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  // Typ se přestaví přes text (ne ALTER TYPE … ADD VALUE): novou hodnotu je potřeba
  // použít hned v téže transakci – převod výroben, kde přetoky vykupuje Pražská plynárenská.
  await db.execute(sql`
   ALTER TABLE "vyrobny" ALTER COLUMN "vykup_pretoku" SET DATA TYPE text;
  ALTER TABLE "_vyrobny_v" ALTER COLUMN "version_vykup_pretoku" SET DATA TYPE text;
  DROP TYPE "public"."vyr_vykup";
  CREATE TYPE "public"."vyr_vykup" AS ENUM('bse', 'pp', 'jiny', 'zadny');
  UPDATE "vyrobny" SET "vykup_pretoku" = 'pp', "vykupujici" = NULL
   WHERE "vykup_pretoku" = 'jiny' AND "vykupujici" ILIKE 'Pražská plynárenská%';
  ALTER TABLE "vyrobny" ALTER COLUMN "vykup_pretoku" SET DATA TYPE "public"."vyr_vykup" USING "vykup_pretoku"::"public"."vyr_vykup";
  ALTER TABLE "_vyrobny_v" ALTER COLUMN "version_vykup_pretoku" SET DATA TYPE "public"."vyr_vykup" USING "version_vykup_pretoku"::"public"."vyr_vykup";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "vyrobny" ALTER COLUMN "vykup_pretoku" SET DATA TYPE text;
  ALTER TABLE "_vyrobny_v" ALTER COLUMN "version_vykup_pretoku" SET DATA TYPE text;
  UPDATE "vyrobny" SET "vykup_pretoku" = 'jiny', "vykupujici" = 'Pražská plynárenská, a.s.' WHERE "vykup_pretoku" = 'pp';
  UPDATE "_vyrobny_v" SET "version_vykup_pretoku" = 'jiny' WHERE "version_vykup_pretoku" = 'pp';
  DROP TYPE "public"."vyr_vykup";
  CREATE TYPE "public"."vyr_vykup" AS ENUM('bse', 'jiny', 'zadny');
  ALTER TABLE "vyrobny" ALTER COLUMN "vykup_pretoku" SET DATA TYPE "public"."vyr_vykup" USING "vykup_pretoku"::"public"."vyr_vykup";
  ALTER TABLE "_vyrobny_v" ALTER COLUMN "version_vykup_pretoku" SET DATA TYPE "public"."vyr_vykup" USING "version_vykup_pretoku"::"public"."vyr_vykup";`)
}
