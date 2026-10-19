import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."om_typ_ceny" AS ENUM('fixni', 'spot', 'indexovana');
  CREATE TYPE "public"."enum_odberna_mista_stav" AS ENUM('pripravovane', 'aktivni', 'ukoncene');
  CREATE TYPE "public"."enum_odberna_mista_komodita" AS ENUM('EE', 'ZP');
  CREATE TYPE "public"."enum_odberna_mista_typ_odberu" AS ENUM('NN', 'VN', 'MO', 'SO', 'VO');
  CREATE TYPE "public"."enum_odberna_mista_obchodni_model" AS ENUM('zakaznik', 'obchodnik');
  CREATE TYPE "public"."enum_odberna_mista_typ_zakaznika" AS ENUM('bezny', 'virtualni');
  CREATE TYPE "public"."enum_odberna_mista_spotrebitel" AS ENUM('ano', 'ne');
  CREATE TYPE "public"."om_odhad_rezim" AS ENUM('rocni', 'mesicni');
  CREATE TYPE "public"."om_typ_mereni" AS ENUM('A', 'B', 'C', 'S', 'CM');
  CREATE TYPE "public"."om_periodicita" AS ENUM('mesicni', 'ctvrtletni', 'pololetni', 'rocni');
  CREATE TYPE "public"."om_distributor" AS ENUM('cez-distribuce', 'egd-ee', 'predistribuce', 'lds-ee', 'gasnet', 'egd-zp', 'ppd', 'lds-zp');
  CREATE TYPE "public"."om_pocet_fazi" AS ENUM('1', '3');
  CREATE TYPE "public"."om_napeti" AS ENUM('6', '10', '22', '35');
  CREATE TYPE "public"."om_mereni_strana" AS ENUM('VN', 'NN');
  CREATE TYPE "public"."om_vlastnik_ts" AS ENUM('zakaznik', 'distributor', 'my', 'jiny');
  CREATE TYPE "public"."om_typ_kapacity" AS ENUM('pevna', 'klouzava');
  CREATE TYPE "public"."om_druh_vyrobny" AS ENUM('fve', 'kgj', 'jina');
  CREATE TYPE "public"."om_stav_dodatku" AS ENUM('nepotreba', 'pripravit', 'jednani', 'podepsan');
  CREATE TYPE "public"."enum__odberna_mista_v_version_stav" AS ENUM('pripravovane', 'aktivni', 'ukoncene');
  CREATE TYPE "public"."enum__odberna_mista_v_version_komodita" AS ENUM('EE', 'ZP');
  CREATE TYPE "public"."enum__odberna_mista_v_version_typ_odberu" AS ENUM('NN', 'VN', 'MO', 'SO', 'VO');
  CREATE TYPE "public"."enum__odberna_mista_v_version_obchodni_model" AS ENUM('zakaznik', 'obchodnik');
  CREATE TYPE "public"."enum__odberna_mista_v_version_typ_zakaznika" AS ENUM('bezny', 'virtualni');
  CREATE TYPE "public"."enum__odberna_mista_v_version_spotrebitel" AS ENUM('ano', 'ne');
  CREATE TYPE "public"."enum_zakaznici_typ_subjektu" AS ENUM('po', 'fop', 'fo');
  CREATE TYPE "public"."enum__zakaznici_v_version_typ_subjektu" AS ENUM('po', 'fop', 'fo');
  CREATE TYPE "public"."enum_smlouvy_typ" AS ENUM('dodavka', 'pripojeni', 'najemni', 'nakup-ee', 'vykup-ee', 'distribuce', 'ramcova', 'jina');
  CREATE TYPE "public"."enum_smlouvy_komodita" AS ENUM('EE', 'ZP');
  CREATE TYPE "public"."enum_smlouvy_stav" AS ENUM('koncept', 'platna', 'ukoncena');
  CREATE TYPE "public"."enum__smlouvy_v_version_typ" AS ENUM('dodavka', 'pripojeni', 'najemni', 'nakup-ee', 'vykup-ee', 'distribuce', 'ramcova', 'jina');
  CREATE TYPE "public"."enum__smlouvy_v_version_komodita" AS ENUM('EE', 'ZP');
  CREATE TYPE "public"."enum__smlouvy_v_version_stav" AS ENUM('koncept', 'platna', 'ukoncena');
  CREATE TYPE "public"."enum_dokumenty_typ" AS ENUM('smlouva', 'dodatek', 'plna-moc', 'revize', 'technicka', 'korespondence', 'jiny');
  CREATE TYPE "public"."enum_users_roles" AS ENUM('admin', 'obchod', 'operativa', 'cteni');
  CREATE TABLE "odberna_mista_obchod_cenova_obdobi" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"od" timestamp(3) with time zone NOT NULL,
  	"do" timestamp(3) with time zone NOT NULL,
  	"typ_ceny" "om_typ_ceny" DEFAULT 'fixni' NOT NULL,
  	"dodavatel_nakupu" varchar,
  	"nakupni_cena" numeric,
  	"prodejni_cena" numeric,
  	"marze" numeric,
  	"stala_platba" numeric,
  	"poznamka" varchar
  );
  
  CREATE TABLE "odberna_mista" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"interni_cislo" varchar,
  	"oznaceni" varchar,
  	"stav" "enum_odberna_mista_stav" DEFAULT 'pripravovane' NOT NULL,
  	"zahajeni_dodavky" timestamp(3) with time zone,
  	"ukonceni_dodavky" timestamp(3) with time zone,
  	"nakoupeno_do" timestamp(3) with time zone,
  	"zalozil_id" integer,
  	"upravil_id" integer,
  	"komodita" "enum_odberna_mista_komodita" NOT NULL,
  	"typ_odberu" "enum_odberna_mista_typ_odberu" NOT NULL,
  	"obchodni_model" "enum_odberna_mista_obchodni_model" NOT NULL,
  	"typ_zakaznika" "enum_odberna_mista_typ_zakaznika" DEFAULT 'bezny' NOT NULL,
  	"zakaznik_id" integer NOT NULL,
  	"soubor_o_m_id" integer,
  	"spotrebitel" "enum_odberna_mista_spotrebitel" DEFAULT 'ne' NOT NULL,
  	"kod" varchar NOT NULL,
  	"adresa_ulice" varchar,
  	"adresa_cislo_popisne" varchar,
  	"adresa_cislo_orientacni" varchar,
  	"adresa_obec" varchar,
  	"adresa_cast_obce" varchar,
  	"adresa_psc" varchar,
  	"adresa_katastralni_uzemi" varchar,
  	"adresa_parcelni_cislo" varchar,
  	"adresa_text" varchar,
  	"poznamka" varchar,
  	"odhad_spotreby_rezim" "om_odhad_rezim" DEFAULT 'rocni' NOT NULL,
  	"odhad_spotreby_rocni_mwh" numeric,
  	"odhad_spotreby_mesicni_leden" numeric,
  	"odhad_spotreby_mesicni_unor" numeric,
  	"odhad_spotreby_mesicni_brezen" numeric,
  	"odhad_spotreby_mesicni_duben" numeric,
  	"odhad_spotreby_mesicni_kveten" numeric,
  	"odhad_spotreby_mesicni_cerven" numeric,
  	"odhad_spotreby_mesicni_cervenec" numeric,
  	"odhad_spotreby_mesicni_srpen" numeric,
  	"odhad_spotreby_mesicni_zari" numeric,
  	"odhad_spotreby_mesicni_rijen" numeric,
  	"odhad_spotreby_mesicni_listopad" numeric,
  	"odhad_spotreby_mesicni_prosinec" numeric,
  	"mereni_typ_mereni" "om_typ_mereni",
  	"mereni_periodicita_odectu" "om_periodicita",
  	"mereni_cislo_meridla" varchar,
  	"mereni_distributor" "om_distributor",
  	"mereni_nazev_l_d_s" varchar,
  	"parametry_n_n_hlavni_jistic" numeric,
  	"parametry_n_n_pocet_fazi" "om_pocet_fazi",
  	"parametry_n_n_distribucni_sazba" varchar,
  	"parametry_v_n_napetova_hladina" "om_napeti",
  	"parametry_v_n_rezervovana_kapacita_kw" numeric,
  	"parametry_v_n_rezervovany_prikon_kw" numeric,
  	"parametry_v_n_mereni_na_strane" "om_mereni_strana",
  	"parametry_v_n_trafostanice" varchar,
  	"parametry_v_n_vlastnik_trafostanice" "om_vlastnik_ts",
  	"parametry_plyn_denni_kapacita_m3" numeric,
  	"parametry_plyn_typ_kapacity" "om_typ_kapacity",
  	"vyrobna_ma_vyrobnu" boolean DEFAULT false,
  	"vyrobna_druh" "om_druh_vyrobny",
  	"vyrobna_instalovany_vykon_kwp" numeric,
  	"vyrobna_rezervovany_vykon_kw" numeric,
  	"smlouva_o_dodavce_id" integer,
  	"obchod_dodatek_stav" "om_stav_dodatku" DEFAULT 'nepotreba',
  	"obchod_dodatek_termin" timestamp(3) with time zone,
  	"obchod_dodatek_poznamka" varchar,
  	"obchod_poznamka" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "odberna_mista_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"smlouvy_id" integer,
  	"dokumenty_id" integer
  );
  
  CREATE TABLE "_odberna_mista_v_version_obchod_cenova_obdobi" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"od" timestamp(3) with time zone NOT NULL,
  	"do" timestamp(3) with time zone NOT NULL,
  	"typ_ceny" "om_typ_ceny" DEFAULT 'fixni' NOT NULL,
  	"dodavatel_nakupu" varchar,
  	"nakupni_cena" numeric,
  	"prodejni_cena" numeric,
  	"marze" numeric,
  	"stala_platba" numeric,
  	"poznamka" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_odberna_mista_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_interni_cislo" varchar,
  	"version_oznaceni" varchar,
  	"version_stav" "enum__odberna_mista_v_version_stav" DEFAULT 'pripravovane' NOT NULL,
  	"version_zahajeni_dodavky" timestamp(3) with time zone,
  	"version_ukonceni_dodavky" timestamp(3) with time zone,
  	"version_nakoupeno_do" timestamp(3) with time zone,
  	"version_zalozil_id" integer,
  	"version_upravil_id" integer,
  	"version_komodita" "enum__odberna_mista_v_version_komodita" NOT NULL,
  	"version_typ_odberu" "enum__odberna_mista_v_version_typ_odberu" NOT NULL,
  	"version_obchodni_model" "enum__odberna_mista_v_version_obchodni_model" NOT NULL,
  	"version_typ_zakaznika" "enum__odberna_mista_v_version_typ_zakaznika" DEFAULT 'bezny' NOT NULL,
  	"version_zakaznik_id" integer NOT NULL,
  	"version_soubor_o_m_id" integer,
  	"version_spotrebitel" "enum__odberna_mista_v_version_spotrebitel" DEFAULT 'ne' NOT NULL,
  	"version_kod" varchar NOT NULL,
  	"version_adresa_ulice" varchar,
  	"version_adresa_cislo_popisne" varchar,
  	"version_adresa_cislo_orientacni" varchar,
  	"version_adresa_obec" varchar,
  	"version_adresa_cast_obce" varchar,
  	"version_adresa_psc" varchar,
  	"version_adresa_katastralni_uzemi" varchar,
  	"version_adresa_parcelni_cislo" varchar,
  	"version_adresa_text" varchar,
  	"version_poznamka" varchar,
  	"version_odhad_spotreby_rezim" "om_odhad_rezim" DEFAULT 'rocni' NOT NULL,
  	"version_odhad_spotreby_rocni_mwh" numeric,
  	"version_odhad_spotreby_mesicni_leden" numeric,
  	"version_odhad_spotreby_mesicni_unor" numeric,
  	"version_odhad_spotreby_mesicni_brezen" numeric,
  	"version_odhad_spotreby_mesicni_duben" numeric,
  	"version_odhad_spotreby_mesicni_kveten" numeric,
  	"version_odhad_spotreby_mesicni_cerven" numeric,
  	"version_odhad_spotreby_mesicni_cervenec" numeric,
  	"version_odhad_spotreby_mesicni_srpen" numeric,
  	"version_odhad_spotreby_mesicni_zari" numeric,
  	"version_odhad_spotreby_mesicni_rijen" numeric,
  	"version_odhad_spotreby_mesicni_listopad" numeric,
  	"version_odhad_spotreby_mesicni_prosinec" numeric,
  	"version_mereni_typ_mereni" "om_typ_mereni",
  	"version_mereni_periodicita_odectu" "om_periodicita",
  	"version_mereni_cislo_meridla" varchar,
  	"version_mereni_distributor" "om_distributor",
  	"version_mereni_nazev_l_d_s" varchar,
  	"version_parametry_n_n_hlavni_jistic" numeric,
  	"version_parametry_n_n_pocet_fazi" "om_pocet_fazi",
  	"version_parametry_n_n_distribucni_sazba" varchar,
  	"version_parametry_v_n_napetova_hladina" "om_napeti",
  	"version_parametry_v_n_rezervovana_kapacita_kw" numeric,
  	"version_parametry_v_n_rezervovany_prikon_kw" numeric,
  	"version_parametry_v_n_mereni_na_strane" "om_mereni_strana",
  	"version_parametry_v_n_trafostanice" varchar,
  	"version_parametry_v_n_vlastnik_trafostanice" "om_vlastnik_ts",
  	"version_parametry_plyn_denni_kapacita_m3" numeric,
  	"version_parametry_plyn_typ_kapacity" "om_typ_kapacity",
  	"version_vyrobna_ma_vyrobnu" boolean DEFAULT false,
  	"version_vyrobna_druh" "om_druh_vyrobny",
  	"version_vyrobna_instalovany_vykon_kwp" numeric,
  	"version_vyrobna_rezervovany_vykon_kw" numeric,
  	"version_smlouva_o_dodavce_id" integer,
  	"version_obchod_dodatek_stav" "om_stav_dodatku" DEFAULT 'nepotreba',
  	"version_obchod_dodatek_termin" timestamp(3) with time zone,
  	"version_obchod_dodatek_poznamka" varchar,
  	"version_obchod_poznamka" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "_odberna_mista_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"smlouvy_id" integer,
  	"dokumenty_id" integer
  );
  
  CREATE TABLE "zakaznici" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"nazev" varchar NOT NULL,
  	"typ_subjektu" "enum_zakaznici_typ_subjektu" DEFAULT 'po' NOT NULL,
  	"ico" varchar,
  	"dic" varchar,
  	"sidlo_ulice" varchar,
  	"sidlo_cislo_popisne" varchar,
  	"sidlo_cislo_orientacni" varchar,
  	"sidlo_obec" varchar,
  	"sidlo_cast_obce" varchar,
  	"sidlo_psc" varchar,
  	"sidlo_katastralni_uzemi" varchar,
  	"sidlo_parcelni_cislo" varchar,
  	"kontakt_jmeno" varchar,
  	"kontakt_email" varchar,
  	"kontakt_telefon" varchar,
  	"poznamka" varchar,
  	"zalozil_id" integer,
  	"upravil_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "_zakaznici_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_nazev" varchar NOT NULL,
  	"version_typ_subjektu" "enum__zakaznici_v_version_typ_subjektu" DEFAULT 'po' NOT NULL,
  	"version_ico" varchar,
  	"version_dic" varchar,
  	"version_sidlo_ulice" varchar,
  	"version_sidlo_cislo_popisne" varchar,
  	"version_sidlo_cislo_orientacni" varchar,
  	"version_sidlo_obec" varchar,
  	"version_sidlo_cast_obce" varchar,
  	"version_sidlo_psc" varchar,
  	"version_sidlo_katastralni_uzemi" varchar,
  	"version_sidlo_parcelni_cislo" varchar,
  	"version_kontakt_jmeno" varchar,
  	"version_kontakt_email" varchar,
  	"version_kontakt_telefon" varchar,
  	"version_poznamka" varchar,
  	"version_zalozil_id" integer,
  	"version_upravil_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "soubory_om" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"nazev" varchar NOT NULL,
  	"lokalita" varchar,
  	"vlastnik_arealu_id" integer,
  	"popis" varchar,
  	"zalozil_id" integer,
  	"upravil_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "smlouvy_dodatky" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"cislo" varchar NOT NULL,
  	"datum" timestamp(3) with time zone,
  	"predmet" varchar,
  	"soubor_id" integer
  );
  
  CREATE TABLE "smlouvy" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"oznaceni" varchar,
  	"cislo" varchar NOT NULL,
  	"typ" "enum_smlouvy_typ" NOT NULL,
  	"komodita" "enum_smlouvy_komodita",
  	"zakaznik_id" integer,
  	"protistrana" varchar,
  	"datum_uzavreni" timestamp(3) with time zone,
  	"platnost_od" timestamp(3) with time zone,
  	"platnost_do" timestamp(3) with time zone,
  	"vypovedni_lhuta" varchar,
  	"stav" "enum_smlouvy_stav" DEFAULT 'platna' NOT NULL,
  	"soubor_id" integer,
  	"poznamka" varchar,
  	"zalozil_id" integer,
  	"upravil_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "_smlouvy_v_version_dodatky" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"cislo" varchar NOT NULL,
  	"datum" timestamp(3) with time zone,
  	"predmet" varchar,
  	"soubor_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_smlouvy_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_oznaceni" varchar,
  	"version_cislo" varchar NOT NULL,
  	"version_typ" "enum__smlouvy_v_version_typ" NOT NULL,
  	"version_komodita" "enum__smlouvy_v_version_komodita",
  	"version_zakaznik_id" integer,
  	"version_protistrana" varchar,
  	"version_datum_uzavreni" timestamp(3) with time zone,
  	"version_platnost_od" timestamp(3) with time zone,
  	"version_platnost_do" timestamp(3) with time zone,
  	"version_vypovedni_lhuta" varchar,
  	"version_stav" "enum__smlouvy_v_version_stav" DEFAULT 'platna' NOT NULL,
  	"version_soubor_id" integer,
  	"version_poznamka" varchar,
  	"version_zalozil_id" integer,
  	"version_upravil_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "dokumenty" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"nazev" varchar NOT NULL,
  	"typ" "enum_dokumenty_typ" NOT NULL,
  	"poznamka" varchar,
  	"zalozil_id" integer,
  	"upravil_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "users_roles" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_users_roles",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"jmeno" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"reset_password_requested_at" timestamp(3) with time zone,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"odberna_mista_id" integer,
  	"zakaznici_id" integer,
  	"soubory_om_id" integer,
  	"smlouvy_id" integer,
  	"dokumenty_id" integer,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "odberna_mista_obchod_cenova_obdobi" ADD CONSTRAINT "odberna_mista_obchod_cenova_obdobi_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."odberna_mista"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "odberna_mista" ADD CONSTRAINT "odberna_mista_zalozil_id_users_id_fk" FOREIGN KEY ("zalozil_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "odberna_mista" ADD CONSTRAINT "odberna_mista_upravil_id_users_id_fk" FOREIGN KEY ("upravil_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "odberna_mista" ADD CONSTRAINT "odberna_mista_zakaznik_id_zakaznici_id_fk" FOREIGN KEY ("zakaznik_id") REFERENCES "public"."zakaznici"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "odberna_mista" ADD CONSTRAINT "odberna_mista_soubor_o_m_id_soubory_om_id_fk" FOREIGN KEY ("soubor_o_m_id") REFERENCES "public"."soubory_om"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "odberna_mista" ADD CONSTRAINT "odberna_mista_smlouva_o_dodavce_id_smlouvy_id_fk" FOREIGN KEY ("smlouva_o_dodavce_id") REFERENCES "public"."smlouvy"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "odberna_mista_rels" ADD CONSTRAINT "odberna_mista_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."odberna_mista"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "odberna_mista_rels" ADD CONSTRAINT "odberna_mista_rels_smlouvy_fk" FOREIGN KEY ("smlouvy_id") REFERENCES "public"."smlouvy"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "odberna_mista_rels" ADD CONSTRAINT "odberna_mista_rels_dokumenty_fk" FOREIGN KEY ("dokumenty_id") REFERENCES "public"."dokumenty"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_odberna_mista_v_version_obchod_cenova_obdobi" ADD CONSTRAINT "_odberna_mista_v_version_obchod_cenova_obdobi_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_odberna_mista_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_odberna_mista_v" ADD CONSTRAINT "_odberna_mista_v_parent_id_odberna_mista_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."odberna_mista"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_odberna_mista_v" ADD CONSTRAINT "_odberna_mista_v_version_zalozil_id_users_id_fk" FOREIGN KEY ("version_zalozil_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_odberna_mista_v" ADD CONSTRAINT "_odberna_mista_v_version_upravil_id_users_id_fk" FOREIGN KEY ("version_upravil_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_odberna_mista_v" ADD CONSTRAINT "_odberna_mista_v_version_zakaznik_id_zakaznici_id_fk" FOREIGN KEY ("version_zakaznik_id") REFERENCES "public"."zakaznici"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_odberna_mista_v" ADD CONSTRAINT "_odberna_mista_v_version_soubor_o_m_id_soubory_om_id_fk" FOREIGN KEY ("version_soubor_o_m_id") REFERENCES "public"."soubory_om"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_odberna_mista_v" ADD CONSTRAINT "_odberna_mista_v_version_smlouva_o_dodavce_id_smlouvy_id_fk" FOREIGN KEY ("version_smlouva_o_dodavce_id") REFERENCES "public"."smlouvy"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_odberna_mista_v_rels" ADD CONSTRAINT "_odberna_mista_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_odberna_mista_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_odberna_mista_v_rels" ADD CONSTRAINT "_odberna_mista_v_rels_smlouvy_fk" FOREIGN KEY ("smlouvy_id") REFERENCES "public"."smlouvy"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_odberna_mista_v_rels" ADD CONSTRAINT "_odberna_mista_v_rels_dokumenty_fk" FOREIGN KEY ("dokumenty_id") REFERENCES "public"."dokumenty"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "zakaznici" ADD CONSTRAINT "zakaznici_zalozil_id_users_id_fk" FOREIGN KEY ("zalozil_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "zakaznici" ADD CONSTRAINT "zakaznici_upravil_id_users_id_fk" FOREIGN KEY ("upravil_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_zakaznici_v" ADD CONSTRAINT "_zakaznici_v_parent_id_zakaznici_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."zakaznici"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_zakaznici_v" ADD CONSTRAINT "_zakaznici_v_version_zalozil_id_users_id_fk" FOREIGN KEY ("version_zalozil_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_zakaznici_v" ADD CONSTRAINT "_zakaznici_v_version_upravil_id_users_id_fk" FOREIGN KEY ("version_upravil_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "soubory_om" ADD CONSTRAINT "soubory_om_vlastnik_arealu_id_zakaznici_id_fk" FOREIGN KEY ("vlastnik_arealu_id") REFERENCES "public"."zakaznici"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "soubory_om" ADD CONSTRAINT "soubory_om_zalozil_id_users_id_fk" FOREIGN KEY ("zalozil_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "soubory_om" ADD CONSTRAINT "soubory_om_upravil_id_users_id_fk" FOREIGN KEY ("upravil_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "smlouvy_dodatky" ADD CONSTRAINT "smlouvy_dodatky_soubor_id_dokumenty_id_fk" FOREIGN KEY ("soubor_id") REFERENCES "public"."dokumenty"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "smlouvy_dodatky" ADD CONSTRAINT "smlouvy_dodatky_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."smlouvy"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "smlouvy" ADD CONSTRAINT "smlouvy_zakaznik_id_zakaznici_id_fk" FOREIGN KEY ("zakaznik_id") REFERENCES "public"."zakaznici"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "smlouvy" ADD CONSTRAINT "smlouvy_soubor_id_dokumenty_id_fk" FOREIGN KEY ("soubor_id") REFERENCES "public"."dokumenty"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "smlouvy" ADD CONSTRAINT "smlouvy_zalozil_id_users_id_fk" FOREIGN KEY ("zalozil_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "smlouvy" ADD CONSTRAINT "smlouvy_upravil_id_users_id_fk" FOREIGN KEY ("upravil_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_smlouvy_v_version_dodatky" ADD CONSTRAINT "_smlouvy_v_version_dodatky_soubor_id_dokumenty_id_fk" FOREIGN KEY ("soubor_id") REFERENCES "public"."dokumenty"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_smlouvy_v_version_dodatky" ADD CONSTRAINT "_smlouvy_v_version_dodatky_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_smlouvy_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_smlouvy_v" ADD CONSTRAINT "_smlouvy_v_parent_id_smlouvy_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."smlouvy"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_smlouvy_v" ADD CONSTRAINT "_smlouvy_v_version_zakaznik_id_zakaznici_id_fk" FOREIGN KEY ("version_zakaznik_id") REFERENCES "public"."zakaznici"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_smlouvy_v" ADD CONSTRAINT "_smlouvy_v_version_soubor_id_dokumenty_id_fk" FOREIGN KEY ("version_soubor_id") REFERENCES "public"."dokumenty"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_smlouvy_v" ADD CONSTRAINT "_smlouvy_v_version_zalozil_id_users_id_fk" FOREIGN KEY ("version_zalozil_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_smlouvy_v" ADD CONSTRAINT "_smlouvy_v_version_upravil_id_users_id_fk" FOREIGN KEY ("version_upravil_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "dokumenty" ADD CONSTRAINT "dokumenty_zalozil_id_users_id_fk" FOREIGN KEY ("zalozil_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "dokumenty" ADD CONSTRAINT "dokumenty_upravil_id_users_id_fk" FOREIGN KEY ("upravil_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "users_roles" ADD CONSTRAINT "users_roles_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_odberna_mista_fk" FOREIGN KEY ("odberna_mista_id") REFERENCES "public"."odberna_mista"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_zakaznici_fk" FOREIGN KEY ("zakaznici_id") REFERENCES "public"."zakaznici"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_soubory_om_fk" FOREIGN KEY ("soubory_om_id") REFERENCES "public"."soubory_om"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_smlouvy_fk" FOREIGN KEY ("smlouvy_id") REFERENCES "public"."smlouvy"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_dokumenty_fk" FOREIGN KEY ("dokumenty_id") REFERENCES "public"."dokumenty"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "odberna_mista_obchod_cenova_obdobi_order_idx" ON "odberna_mista_obchod_cenova_obdobi" USING btree ("_order");
  CREATE INDEX "odberna_mista_obchod_cenova_obdobi_parent_id_idx" ON "odberna_mista_obchod_cenova_obdobi" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "odberna_mista_interni_cislo_idx" ON "odberna_mista" USING btree ("interni_cislo");
  CREATE INDEX "odberna_mista_nakoupeno_do_idx" ON "odberna_mista" USING btree ("nakoupeno_do");
  CREATE INDEX "odberna_mista_zalozil_idx" ON "odberna_mista" USING btree ("zalozil_id");
  CREATE INDEX "odberna_mista_upravil_idx" ON "odberna_mista" USING btree ("upravil_id");
  CREATE INDEX "odberna_mista_komodita_idx" ON "odberna_mista" USING btree ("komodita");
  CREATE INDEX "odberna_mista_typ_odberu_idx" ON "odberna_mista" USING btree ("typ_odberu");
  CREATE INDEX "odberna_mista_zakaznik_idx" ON "odberna_mista" USING btree ("zakaznik_id");
  CREATE INDEX "odberna_mista_soubor_o_m_idx" ON "odberna_mista" USING btree ("soubor_o_m_id");
  CREATE UNIQUE INDEX "odberna_mista_kod_idx" ON "odberna_mista" USING btree ("kod");
  CREATE INDEX "odberna_mista_adresa_text_idx" ON "odberna_mista" USING btree ("adresa_text");
  CREATE INDEX "odberna_mista_smlouva_o_dodavce_idx" ON "odberna_mista" USING btree ("smlouva_o_dodavce_id");
  CREATE INDEX "odberna_mista_updated_at_idx" ON "odberna_mista" USING btree ("updated_at");
  CREATE INDEX "odberna_mista_created_at_idx" ON "odberna_mista" USING btree ("created_at");
  CREATE INDEX "komodita_stav_idx" ON "odberna_mista" USING btree ("komodita","stav");
  CREATE INDEX "odberna_mista_rels_order_idx" ON "odberna_mista_rels" USING btree ("order");
  CREATE INDEX "odberna_mista_rels_parent_idx" ON "odberna_mista_rels" USING btree ("parent_id");
  CREATE INDEX "odberna_mista_rels_path_idx" ON "odberna_mista_rels" USING btree ("path");
  CREATE INDEX "odberna_mista_rels_smlouvy_id_idx" ON "odberna_mista_rels" USING btree ("smlouvy_id");
  CREATE INDEX "odberna_mista_rels_dokumenty_id_idx" ON "odberna_mista_rels" USING btree ("dokumenty_id");
  CREATE INDEX "_odberna_mista_v_version_obchod_cenova_obdobi_order_idx" ON "_odberna_mista_v_version_obchod_cenova_obdobi" USING btree ("_order");
  CREATE INDEX "_odberna_mista_v_version_obchod_cenova_obdobi_parent_id_idx" ON "_odberna_mista_v_version_obchod_cenova_obdobi" USING btree ("_parent_id");
  CREATE INDEX "_odberna_mista_v_parent_idx" ON "_odberna_mista_v" USING btree ("parent_id");
  CREATE INDEX "_odberna_mista_v_version_version_interni_cislo_idx" ON "_odberna_mista_v" USING btree ("version_interni_cislo");
  CREATE INDEX "_odberna_mista_v_version_version_nakoupeno_do_idx" ON "_odberna_mista_v" USING btree ("version_nakoupeno_do");
  CREATE INDEX "_odberna_mista_v_version_version_zalozil_idx" ON "_odberna_mista_v" USING btree ("version_zalozil_id");
  CREATE INDEX "_odberna_mista_v_version_version_upravil_idx" ON "_odberna_mista_v" USING btree ("version_upravil_id");
  CREATE INDEX "_odberna_mista_v_version_version_komodita_idx" ON "_odberna_mista_v" USING btree ("version_komodita");
  CREATE INDEX "_odberna_mista_v_version_version_typ_odberu_idx" ON "_odberna_mista_v" USING btree ("version_typ_odberu");
  CREATE INDEX "_odberna_mista_v_version_version_zakaznik_idx" ON "_odberna_mista_v" USING btree ("version_zakaznik_id");
  CREATE INDEX "_odberna_mista_v_version_version_soubor_o_m_idx" ON "_odberna_mista_v" USING btree ("version_soubor_o_m_id");
  CREATE INDEX "_odberna_mista_v_version_version_kod_idx" ON "_odberna_mista_v" USING btree ("version_kod");
  CREATE INDEX "_odberna_mista_v_version_version_adresa_text_idx" ON "_odberna_mista_v" USING btree ("version_adresa_text");
  CREATE INDEX "_odberna_mista_v_version_version_smlouva_o_dodavce_idx" ON "_odberna_mista_v" USING btree ("version_smlouva_o_dodavce_id");
  CREATE INDEX "_odberna_mista_v_version_version_updated_at_idx" ON "_odberna_mista_v" USING btree ("version_updated_at");
  CREATE INDEX "_odberna_mista_v_version_version_created_at_idx" ON "_odberna_mista_v" USING btree ("version_created_at");
  CREATE INDEX "_odberna_mista_v_created_at_idx" ON "_odberna_mista_v" USING btree ("created_at");
  CREATE INDEX "_odberna_mista_v_updated_at_idx" ON "_odberna_mista_v" USING btree ("updated_at");
  CREATE INDEX "version_komodita_version_stav_idx" ON "_odberna_mista_v" USING btree ("version_komodita","version_stav");
  CREATE INDEX "_odberna_mista_v_rels_order_idx" ON "_odberna_mista_v_rels" USING btree ("order");
  CREATE INDEX "_odberna_mista_v_rels_parent_idx" ON "_odberna_mista_v_rels" USING btree ("parent_id");
  CREATE INDEX "_odberna_mista_v_rels_path_idx" ON "_odberna_mista_v_rels" USING btree ("path");
  CREATE INDEX "_odberna_mista_v_rels_smlouvy_id_idx" ON "_odberna_mista_v_rels" USING btree ("smlouvy_id");
  CREATE INDEX "_odberna_mista_v_rels_dokumenty_id_idx" ON "_odberna_mista_v_rels" USING btree ("dokumenty_id");
  CREATE UNIQUE INDEX "zakaznici_ico_idx" ON "zakaznici" USING btree ("ico");
  CREATE INDEX "zakaznici_zalozil_idx" ON "zakaznici" USING btree ("zalozil_id");
  CREATE INDEX "zakaznici_upravil_idx" ON "zakaznici" USING btree ("upravil_id");
  CREATE INDEX "zakaznici_updated_at_idx" ON "zakaznici" USING btree ("updated_at");
  CREATE INDEX "zakaznici_created_at_idx" ON "zakaznici" USING btree ("created_at");
  CREATE INDEX "_zakaznici_v_parent_idx" ON "_zakaznici_v" USING btree ("parent_id");
  CREATE INDEX "_zakaznici_v_version_version_ico_idx" ON "_zakaznici_v" USING btree ("version_ico");
  CREATE INDEX "_zakaznici_v_version_version_zalozil_idx" ON "_zakaznici_v" USING btree ("version_zalozil_id");
  CREATE INDEX "_zakaznici_v_version_version_upravil_idx" ON "_zakaznici_v" USING btree ("version_upravil_id");
  CREATE INDEX "_zakaznici_v_version_version_updated_at_idx" ON "_zakaznici_v" USING btree ("version_updated_at");
  CREATE INDEX "_zakaznici_v_version_version_created_at_idx" ON "_zakaznici_v" USING btree ("version_created_at");
  CREATE INDEX "_zakaznici_v_created_at_idx" ON "_zakaznici_v" USING btree ("created_at");
  CREATE INDEX "_zakaznici_v_updated_at_idx" ON "_zakaznici_v" USING btree ("updated_at");
  CREATE UNIQUE INDEX "soubory_om_nazev_idx" ON "soubory_om" USING btree ("nazev");
  CREATE INDEX "soubory_om_vlastnik_arealu_idx" ON "soubory_om" USING btree ("vlastnik_arealu_id");
  CREATE INDEX "soubory_om_zalozil_idx" ON "soubory_om" USING btree ("zalozil_id");
  CREATE INDEX "soubory_om_upravil_idx" ON "soubory_om" USING btree ("upravil_id");
  CREATE INDEX "soubory_om_updated_at_idx" ON "soubory_om" USING btree ("updated_at");
  CREATE INDEX "soubory_om_created_at_idx" ON "soubory_om" USING btree ("created_at");
  CREATE INDEX "smlouvy_dodatky_order_idx" ON "smlouvy_dodatky" USING btree ("_order");
  CREATE INDEX "smlouvy_dodatky_parent_id_idx" ON "smlouvy_dodatky" USING btree ("_parent_id");
  CREATE INDEX "smlouvy_dodatky_soubor_idx" ON "smlouvy_dodatky" USING btree ("soubor_id");
  CREATE INDEX "smlouvy_cislo_idx" ON "smlouvy" USING btree ("cislo");
  CREATE INDEX "smlouvy_zakaznik_idx" ON "smlouvy" USING btree ("zakaznik_id");
  CREATE INDEX "smlouvy_soubor_idx" ON "smlouvy" USING btree ("soubor_id");
  CREATE INDEX "smlouvy_zalozil_idx" ON "smlouvy" USING btree ("zalozil_id");
  CREATE INDEX "smlouvy_upravil_idx" ON "smlouvy" USING btree ("upravil_id");
  CREATE INDEX "smlouvy_updated_at_idx" ON "smlouvy" USING btree ("updated_at");
  CREATE INDEX "smlouvy_created_at_idx" ON "smlouvy" USING btree ("created_at");
  CREATE INDEX "_smlouvy_v_version_dodatky_order_idx" ON "_smlouvy_v_version_dodatky" USING btree ("_order");
  CREATE INDEX "_smlouvy_v_version_dodatky_parent_id_idx" ON "_smlouvy_v_version_dodatky" USING btree ("_parent_id");
  CREATE INDEX "_smlouvy_v_version_dodatky_soubor_idx" ON "_smlouvy_v_version_dodatky" USING btree ("soubor_id");
  CREATE INDEX "_smlouvy_v_parent_idx" ON "_smlouvy_v" USING btree ("parent_id");
  CREATE INDEX "_smlouvy_v_version_version_cislo_idx" ON "_smlouvy_v" USING btree ("version_cislo");
  CREATE INDEX "_smlouvy_v_version_version_zakaznik_idx" ON "_smlouvy_v" USING btree ("version_zakaznik_id");
  CREATE INDEX "_smlouvy_v_version_version_soubor_idx" ON "_smlouvy_v" USING btree ("version_soubor_id");
  CREATE INDEX "_smlouvy_v_version_version_zalozil_idx" ON "_smlouvy_v" USING btree ("version_zalozil_id");
  CREATE INDEX "_smlouvy_v_version_version_upravil_idx" ON "_smlouvy_v" USING btree ("version_upravil_id");
  CREATE INDEX "_smlouvy_v_version_version_updated_at_idx" ON "_smlouvy_v" USING btree ("version_updated_at");
  CREATE INDEX "_smlouvy_v_version_version_created_at_idx" ON "_smlouvy_v" USING btree ("version_created_at");
  CREATE INDEX "_smlouvy_v_created_at_idx" ON "_smlouvy_v" USING btree ("created_at");
  CREATE INDEX "_smlouvy_v_updated_at_idx" ON "_smlouvy_v" USING btree ("updated_at");
  CREATE INDEX "dokumenty_zalozil_idx" ON "dokumenty" USING btree ("zalozil_id");
  CREATE INDEX "dokumenty_upravil_idx" ON "dokumenty" USING btree ("upravil_id");
  CREATE INDEX "dokumenty_updated_at_idx" ON "dokumenty" USING btree ("updated_at");
  CREATE INDEX "dokumenty_created_at_idx" ON "dokumenty" USING btree ("created_at");
  CREATE UNIQUE INDEX "dokumenty_filename_idx" ON "dokumenty" USING btree ("filename");
  CREATE INDEX "users_roles_order_idx" ON "users_roles" USING btree ("order");
  CREATE INDEX "users_roles_parent_idx" ON "users_roles" USING btree ("parent_id");
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_odberna_mista_id_idx" ON "payload_locked_documents_rels" USING btree ("odberna_mista_id");
  CREATE INDEX "payload_locked_documents_rels_zakaznici_id_idx" ON "payload_locked_documents_rels" USING btree ("zakaznici_id");
  CREATE INDEX "payload_locked_documents_rels_soubory_om_id_idx" ON "payload_locked_documents_rels" USING btree ("soubory_om_id");
  CREATE INDEX "payload_locked_documents_rels_smlouvy_id_idx" ON "payload_locked_documents_rels" USING btree ("smlouvy_id");
  CREATE INDEX "payload_locked_documents_rels_dokumenty_id_idx" ON "payload_locked_documents_rels" USING btree ("dokumenty_id");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "odberna_mista_obchod_cenova_obdobi" CASCADE;
  DROP TABLE "odberna_mista" CASCADE;
  DROP TABLE "odberna_mista_rels" CASCADE;
  DROP TABLE "_odberna_mista_v_version_obchod_cenova_obdobi" CASCADE;
  DROP TABLE "_odberna_mista_v" CASCADE;
  DROP TABLE "_odberna_mista_v_rels" CASCADE;
  DROP TABLE "zakaznici" CASCADE;
  DROP TABLE "_zakaznici_v" CASCADE;
  DROP TABLE "soubory_om" CASCADE;
  DROP TABLE "smlouvy_dodatky" CASCADE;
  DROP TABLE "smlouvy" CASCADE;
  DROP TABLE "_smlouvy_v_version_dodatky" CASCADE;
  DROP TABLE "_smlouvy_v" CASCADE;
  DROP TABLE "dokumenty" CASCADE;
  DROP TABLE "users_roles" CASCADE;
  DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TYPE "public"."om_typ_ceny";
  DROP TYPE "public"."enum_odberna_mista_stav";
  DROP TYPE "public"."enum_odberna_mista_komodita";
  DROP TYPE "public"."enum_odberna_mista_typ_odberu";
  DROP TYPE "public"."enum_odberna_mista_obchodni_model";
  DROP TYPE "public"."enum_odberna_mista_typ_zakaznika";
  DROP TYPE "public"."enum_odberna_mista_spotrebitel";
  DROP TYPE "public"."om_odhad_rezim";
  DROP TYPE "public"."om_typ_mereni";
  DROP TYPE "public"."om_periodicita";
  DROP TYPE "public"."om_distributor";
  DROP TYPE "public"."om_pocet_fazi";
  DROP TYPE "public"."om_napeti";
  DROP TYPE "public"."om_mereni_strana";
  DROP TYPE "public"."om_vlastnik_ts";
  DROP TYPE "public"."om_typ_kapacity";
  DROP TYPE "public"."om_druh_vyrobny";
  DROP TYPE "public"."om_stav_dodatku";
  DROP TYPE "public"."enum__odberna_mista_v_version_stav";
  DROP TYPE "public"."enum__odberna_mista_v_version_komodita";
  DROP TYPE "public"."enum__odberna_mista_v_version_typ_odberu";
  DROP TYPE "public"."enum__odberna_mista_v_version_obchodni_model";
  DROP TYPE "public"."enum__odberna_mista_v_version_typ_zakaznika";
  DROP TYPE "public"."enum__odberna_mista_v_version_spotrebitel";
  DROP TYPE "public"."enum_zakaznici_typ_subjektu";
  DROP TYPE "public"."enum__zakaznici_v_version_typ_subjektu";
  DROP TYPE "public"."enum_smlouvy_typ";
  DROP TYPE "public"."enum_smlouvy_komodita";
  DROP TYPE "public"."enum_smlouvy_stav";
  DROP TYPE "public"."enum__smlouvy_v_version_typ";
  DROP TYPE "public"."enum__smlouvy_v_version_komodita";
  DROP TYPE "public"."enum__smlouvy_v_version_stav";
  DROP TYPE "public"."enum_dokumenty_typ";
  DROP TYPE "public"."enum_users_roles";`)
}
