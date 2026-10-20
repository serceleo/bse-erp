import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."vyr_typ_mereni" AS ENUM('A', 'B', 'C', 'S');
  ALTER TABLE "vyrobny" ADD COLUMN "typ_mereni" "vyr_typ_mereni";
  ALTER TABLE "vyrobny" ADD COLUMN "edc_akumulace" boolean DEFAULT false;
  ALTER TABLE "vyrobny" ADD COLUMN "edc_flexibilita" boolean DEFAULT false;
  ALTER TABLE "vyrobny" ADD COLUMN "zadost_o_pripojeni_cislo" varchar;
  ALTER TABLE "vyrobny" ADD COLUMN "zadost_o_pripojeni_druh" varchar;
  ALTER TABLE "vyrobny" ADD COLUMN "zadost_o_pripojeni_datum" timestamp(3) with time zone;
  ALTER TABLE "vyrobny" ADD COLUMN "zadost_o_pripojeni_stav" varchar;
  ALTER TABLE "_vyrobny_v" ADD COLUMN "version_typ_mereni" "vyr_typ_mereni";
  ALTER TABLE "_vyrobny_v" ADD COLUMN "version_edc_akumulace" boolean DEFAULT false;
  ALTER TABLE "_vyrobny_v" ADD COLUMN "version_edc_flexibilita" boolean DEFAULT false;
  ALTER TABLE "_vyrobny_v" ADD COLUMN "version_zadost_o_pripojeni_cislo" varchar;
  ALTER TABLE "_vyrobny_v" ADD COLUMN "version_zadost_o_pripojeni_druh" varchar;
  ALTER TABLE "_vyrobny_v" ADD COLUMN "version_zadost_o_pripojeni_datum" timestamp(3) with time zone;
  ALTER TABLE "_vyrobny_v" ADD COLUMN "version_zadost_o_pripojeni_stav" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "vyrobny" DROP COLUMN "typ_mereni";
  ALTER TABLE "vyrobny" DROP COLUMN "edc_akumulace";
  ALTER TABLE "vyrobny" DROP COLUMN "edc_flexibilita";
  ALTER TABLE "vyrobny" DROP COLUMN "zadost_o_pripojeni_cislo";
  ALTER TABLE "vyrobny" DROP COLUMN "zadost_o_pripojeni_druh";
  ALTER TABLE "vyrobny" DROP COLUMN "zadost_o_pripojeni_datum";
  ALTER TABLE "vyrobny" DROP COLUMN "zadost_o_pripojeni_stav";
  ALTER TABLE "_vyrobny_v" DROP COLUMN "version_typ_mereni";
  ALTER TABLE "_vyrobny_v" DROP COLUMN "version_edc_akumulace";
  ALTER TABLE "_vyrobny_v" DROP COLUMN "version_edc_flexibilita";
  ALTER TABLE "_vyrobny_v" DROP COLUMN "version_zadost_o_pripojeni_cislo";
  ALTER TABLE "_vyrobny_v" DROP COLUMN "version_zadost_o_pripojeni_druh";
  ALTER TABLE "_vyrobny_v" DROP COLUMN "version_zadost_o_pripojeni_datum";
  ALTER TABLE "_vyrobny_v" DROP COLUMN "version_zadost_o_pripojeni_stav";
  DROP TYPE "public"."vyr_typ_mereni";`)
}
