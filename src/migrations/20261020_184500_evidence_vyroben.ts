import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."vyr_stav" AS ENUM('provoz', 'priprava', 'mimo-provoz');
  CREATE TYPE "public"."vyr_druh" AS ENUM('fve', 'kgj', 'mve', 'jina');
  CREATE TYPE "public"."vyr_kategorie" AS ENUM('1', '2');
  CREATE TYPE "public"."vyr_rezim" AS ENUM('pretoky', 'bez-pretoku');
  CREATE TYPE "public"."vyr_vykup" AS ENUM('bse', 'jiny', 'zadny');
  CREATE TABLE "vyrobny" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"oznaceni" varchar,
  	"stav" "vyr_stav" DEFAULT 'provoz' NOT NULL,
  	"uvedeni_do_provozu" timestamp(3) with time zone,
  	"zalozil_id" integer,
  	"upravil_id" integer,
  	"odberne_misto_id" integer NOT NULL,
  	"druh" "vyr_druh" DEFAULT 'fve' NOT NULL,
  	"kategorie" "vyr_kategorie",
  	"nazev" varchar,
  	"ean" varchar,
  	"instalovany_vykon_kwp" numeric,
  	"rezervovany_vykon_kw" numeric,
  	"vykon_stridacu_kw" numeric,
  	"akumulace_kwh" numeric,
  	"odhad_vyroby_mwh" numeric,
  	"licence_eru" varchar,
  	"rezim_pretoku" "vyr_rezim",
  	"vykup_pretoku" "vyr_vykup",
  	"vykupujici" varchar,
  	"vykupni_cena" numeric,
  	"poznamka" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "vyrobny_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"dokumenty_id" integer
  );
  
  CREATE TABLE "_vyrobny_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_oznaceni" varchar,
  	"version_stav" "vyr_stav" DEFAULT 'provoz' NOT NULL,
  	"version_uvedeni_do_provozu" timestamp(3) with time zone,
  	"version_zalozil_id" integer,
  	"version_upravil_id" integer,
  	"version_odberne_misto_id" integer NOT NULL,
  	"version_druh" "vyr_druh" DEFAULT 'fve' NOT NULL,
  	"version_kategorie" "vyr_kategorie",
  	"version_nazev" varchar,
  	"version_ean" varchar,
  	"version_instalovany_vykon_kwp" numeric,
  	"version_rezervovany_vykon_kw" numeric,
  	"version_vykon_stridacu_kw" numeric,
  	"version_akumulace_kwh" numeric,
  	"version_odhad_vyroby_mwh" numeric,
  	"version_licence_eru" varchar,
  	"version_rezim_pretoku" "vyr_rezim",
  	"version_vykup_pretoku" "vyr_vykup",
  	"version_vykupujici" varchar,
  	"version_vykupni_cena" numeric,
  	"version_poznamka" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "_vyrobny_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"dokumenty_id" integer
  );
  
  ALTER TABLE "odberna_mista" ADD COLUMN "vyrobny" varchar;
  ALTER TABLE "_odberna_mista_v" ADD COLUMN "version_vyrobny" varchar;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "vyrobny_id" integer;
  ALTER TABLE "vyrobny" ADD CONSTRAINT "vyrobny_zalozil_id_users_id_fk" FOREIGN KEY ("zalozil_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "vyrobny" ADD CONSTRAINT "vyrobny_upravil_id_users_id_fk" FOREIGN KEY ("upravil_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "vyrobny" ADD CONSTRAINT "vyrobny_odberne_misto_id_odberna_mista_id_fk" FOREIGN KEY ("odberne_misto_id") REFERENCES "public"."odberna_mista"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "vyrobny_rels" ADD CONSTRAINT "vyrobny_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."vyrobny"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "vyrobny_rels" ADD CONSTRAINT "vyrobny_rels_dokumenty_fk" FOREIGN KEY ("dokumenty_id") REFERENCES "public"."dokumenty"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_vyrobny_v" ADD CONSTRAINT "_vyrobny_v_parent_id_vyrobny_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."vyrobny"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_vyrobny_v" ADD CONSTRAINT "_vyrobny_v_version_zalozil_id_users_id_fk" FOREIGN KEY ("version_zalozil_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_vyrobny_v" ADD CONSTRAINT "_vyrobny_v_version_upravil_id_users_id_fk" FOREIGN KEY ("version_upravil_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_vyrobny_v" ADD CONSTRAINT "_vyrobny_v_version_odberne_misto_id_odberna_mista_id_fk" FOREIGN KEY ("version_odberne_misto_id") REFERENCES "public"."odberna_mista"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_vyrobny_v_rels" ADD CONSTRAINT "_vyrobny_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_vyrobny_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_vyrobny_v_rels" ADD CONSTRAINT "_vyrobny_v_rels_dokumenty_fk" FOREIGN KEY ("dokumenty_id") REFERENCES "public"."dokumenty"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "vyrobny_zalozil_idx" ON "vyrobny" USING btree ("zalozil_id");
  CREATE INDEX "vyrobny_upravil_idx" ON "vyrobny" USING btree ("upravil_id");
  CREATE INDEX "vyrobny_odberne_misto_idx" ON "vyrobny" USING btree ("odberne_misto_id");
  CREATE UNIQUE INDEX "vyrobny_ean_idx" ON "vyrobny" USING btree ("ean");
  CREATE INDEX "vyrobny_updated_at_idx" ON "vyrobny" USING btree ("updated_at");
  CREATE INDEX "vyrobny_created_at_idx" ON "vyrobny" USING btree ("created_at");
  CREATE INDEX "vyrobny_rels_order_idx" ON "vyrobny_rels" USING btree ("order");
  CREATE INDEX "vyrobny_rels_parent_idx" ON "vyrobny_rels" USING btree ("parent_id");
  CREATE INDEX "vyrobny_rels_path_idx" ON "vyrobny_rels" USING btree ("path");
  CREATE INDEX "vyrobny_rels_dokumenty_id_idx" ON "vyrobny_rels" USING btree ("dokumenty_id");
  CREATE INDEX "_vyrobny_v_parent_idx" ON "_vyrobny_v" USING btree ("parent_id");
  CREATE INDEX "_vyrobny_v_version_version_zalozil_idx" ON "_vyrobny_v" USING btree ("version_zalozil_id");
  CREATE INDEX "_vyrobny_v_version_version_upravil_idx" ON "_vyrobny_v" USING btree ("version_upravil_id");
  CREATE INDEX "_vyrobny_v_version_version_odberne_misto_idx" ON "_vyrobny_v" USING btree ("version_odberne_misto_id");
  CREATE INDEX "_vyrobny_v_version_version_ean_idx" ON "_vyrobny_v" USING btree ("version_ean");
  CREATE INDEX "_vyrobny_v_version_version_updated_at_idx" ON "_vyrobny_v" USING btree ("version_updated_at");
  CREATE INDEX "_vyrobny_v_version_version_created_at_idx" ON "_vyrobny_v" USING btree ("version_created_at");
  CREATE INDEX "_vyrobny_v_created_at_idx" ON "_vyrobny_v" USING btree ("created_at");
  CREATE INDEX "_vyrobny_v_updated_at_idx" ON "_vyrobny_v" USING btree ("updated_at");
  CREATE INDEX "_vyrobny_v_rels_order_idx" ON "_vyrobny_v_rels" USING btree ("order");
  CREATE INDEX "_vyrobny_v_rels_parent_idx" ON "_vyrobny_v_rels" USING btree ("parent_id");
  CREATE INDEX "_vyrobny_v_rels_path_idx" ON "_vyrobny_v_rels" USING btree ("path");
  CREATE INDEX "_vyrobny_v_rels_dokumenty_id_idx" ON "_vyrobny_v_rels" USING btree ("dokumenty_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_vyrobny_fk" FOREIGN KEY ("vyrobny_id") REFERENCES "public"."vyrobny"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_vyrobny_id_idx" ON "payload_locked_documents_rels" USING btree ("vyrobny_id");
`)

  // Převod stávajících výroben (dříve skupina „vyrobna“ přímo u OM) do samostatné evidence.
  // Výrobní EAN a kategorii bereme z poznámky OM, kam je uložil import z portálu ČEZ Distribuce.
  await db.execute(sql`
   INSERT INTO "vyrobny" ("odberne_misto_id", "druh", "stav", "kategorie", "ean", "instalovany_vykon_kwp", "rezervovany_vykon_kw", "oznaceni", "poznamka", "updated_at", "created_at")
   SELECT om."id",
          COALESCE(om."vyrobna_druh"::text, 'fve')::"vyr_druh",
          'provoz',
          CASE WHEN om."poznamka" ILIKE '%výroba 2. kategorie%' THEN '2'::"vyr_kategorie" END,
          substring(om."poznamka" from 'výrobní EAN ([0-9]{18})'),
          om."vyrobna_instalovany_vykon_kwp",
          om."vyrobna_rezervovany_vykon_kw",
          CASE COALESCE(om."vyrobna_druh"::text, 'fve') WHEN 'fve' THEN 'FVE' WHEN 'kgj' THEN 'KGJ' ELSE 'výrobna' END
            || ' – ' || regexp_replace(COALESCE(om."adresa_text", ''), ',[[:space:]]*[0-9]{3} ?[0-9]{2}', ''),
          'Převedeno z údajů o výrobně u OM ' || om."interni_cislo" || '.',
          now(), now()
   FROM "odberna_mista" om
   WHERE om."vyrobna_ma_vyrobnu" = true;

   UPDATE "odberna_mista" om
   SET "vyrobny" = CASE COALESCE(om."vyrobna_druh"::text, 'fve') WHEN 'fve' THEN 'FVE' WHEN 'kgj' THEN 'KGJ' ELSE 'výrobna' END
   WHERE om."vyrobna_ma_vyrobnu" = true;`)

  await db.execute(sql`
  ALTER TABLE "odberna_mista" DROP COLUMN "vyrobna_ma_vyrobnu";
  ALTER TABLE "odberna_mista" DROP COLUMN "vyrobna_druh";
  ALTER TABLE "odberna_mista" DROP COLUMN "vyrobna_instalovany_vykon_kwp";
  ALTER TABLE "odberna_mista" DROP COLUMN "vyrobna_rezervovany_vykon_kw";
  ALTER TABLE "_odberna_mista_v" DROP COLUMN "version_vyrobna_ma_vyrobnu";
  ALTER TABLE "_odberna_mista_v" DROP COLUMN "version_vyrobna_druh";
  ALTER TABLE "_odberna_mista_v" DROP COLUMN "version_vyrobna_instalovany_vykon_kwp";
  ALTER TABLE "_odberna_mista_v" DROP COLUMN "version_vyrobna_rezervovany_vykon_kw";
  DROP TYPE "public"."om_druh_vyrobny";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."om_druh_vyrobny" AS ENUM('fve', 'kgj', 'jina');
  ALTER TABLE "vyrobny" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "vyrobny_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_vyrobny_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_vyrobny_v_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "vyrobny" CASCADE;
  DROP TABLE "vyrobny_rels" CASCADE;
  DROP TABLE "_vyrobny_v" CASCADE;
  DROP TABLE "_vyrobny_v_rels" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_vyrobny_fk";
  
  DROP INDEX "payload_locked_documents_rels_vyrobny_id_idx";
  ALTER TABLE "odberna_mista" ADD COLUMN "vyrobna_ma_vyrobnu" boolean DEFAULT false;
  ALTER TABLE "odberna_mista" ADD COLUMN "vyrobna_druh" "om_druh_vyrobny";
  ALTER TABLE "odberna_mista" ADD COLUMN "vyrobna_instalovany_vykon_kwp" numeric;
  ALTER TABLE "odberna_mista" ADD COLUMN "vyrobna_rezervovany_vykon_kw" numeric;
  ALTER TABLE "_odberna_mista_v" ADD COLUMN "version_vyrobna_ma_vyrobnu" boolean DEFAULT false;
  ALTER TABLE "_odberna_mista_v" ADD COLUMN "version_vyrobna_druh" "om_druh_vyrobny";
  ALTER TABLE "_odberna_mista_v" ADD COLUMN "version_vyrobna_instalovany_vykon_kwp" numeric;
  ALTER TABLE "_odberna_mista_v" ADD COLUMN "version_vyrobna_rezervovany_vykon_kw" numeric;
  ALTER TABLE "odberna_mista" DROP COLUMN "vyrobny";
  ALTER TABLE "_odberna_mista_v" DROP COLUMN "version_vyrobny";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "vyrobny_id";
  DROP TYPE "public"."vyr_stav";
  DROP TYPE "public"."vyr_druh";
  DROP TYPE "public"."vyr_kategorie";
  DROP TYPE "public"."vyr_rezim";
  DROP TYPE "public"."vyr_vykup";`)
}
