# BSE ERP

Webový ERP systém Beskydské energetiky. Stack: **Payload CMS 3 + Next.js 16 + PostgreSQL 17**, česká administrace.

První modul: **Energie – evidence odběrných míst (OM)** elektřiny a plynu, zákazníků, souborů OM, smluv a dokumentů.

## Spuštění

### Varianta A – vše v Dockeru (nejjednodušší, Windows + Docker Desktop)

```bash
cp .env.example .env          # a doplňte PAYLOAD_SECRET (dlouhý náhodný řetězec)
docker compose up -d --build
```

Administrace poběží na http://localhost:3001/admin – první založený účet je automaticky administrátor.

### Varianta B – vývoj (změny v kódu se projeví hned)

```bash
cp .env.example .env          # doplňte PAYLOAD_SECRET
docker compose up -d db       # jen databáze
npm install
npm run dev                   # http://localhost:3001/admin
npm run seed                  # volitelně: ukázková data (4 OM, 3 zákazníci, 2 smlouvy)
```

### Příkazy

| Příkaz                            | Co dělá                                                                 |
| --------------------------------- | ----------------------------------------------------------------------- |
| `npm run dev`                     | vývojový server; schéma DB se synchronizuje automaticky                 |
| `npm test`                        | unit + integrační testy (proti `TEST_DATABASE_URL`, kterou celou smaže) |
| `npm run typecheck`               | kontrola typů                                                           |
| `npm run seed`                    | ukázková data do prázdné databáze                                       |
| `npm run generate:types`          | po změně kolekcí – přegeneruje `src/payload-types.ts`                   |
| `npm run migrate:create -- nazev` | **po každé změně datového modelu** – vytvoří migraci pro produkci       |

V produkci se databáze mění výhradně migracemi (`src/migrations`); čekající migrace se spustí samy při startu aplikace.

## Struktura

```
src/
  modules/energie/          ← modul Energie (každý další modul = vlastní složka)
    collections/            OdbernaMista, Zakaznici, SouboryOM, Smlouvy
    ciselniky.ts            všechny číselníky na jednom místě (komodity, typy odběru, …)
    lib/ciselneRady.ts      číslování OM (řady EE-00001 / ZP-00001)
  collections/              systémové kolekce sdílené celým ERP (Users, Dokumenty)
  shared/
    access/role.ts          role a přístupová práva
    fields/                 znovupoužitelná pole (adresa, audit „založil/upravil“)
    validators/             EAN, EIC, IČO, PSČ – čisté funkce s testy
  migrations/               migrace databáze
tests/                      unit a integrační testy
```

## Datový model – odběrné místo

**Seznam OM** (údaje „skupiny 1“): interní číslo, komodita, typ odběru, obchodní model, soubor OM, zákazník, typ zákazníka, spotřebitel, kód EAN/EIC, adresa, stav.

**Detail OM** – záložky:

1. **Základní údaje** – totéž co v seznamu + poznámka.
2. **Spotřeba a technické údaje** – odhad spotřeby (ročně, nebo po měsících s automatickým součtem), typ měření, periodicita odečtu, distributor; podle varianty navíc parametry **NN** (jistič, fáze, sazba), **VN** (napěťová hladina, rezervovaná kapacita/příkon, trafostanice), **plyn SO/VO** (denní kapacita) a **výrobna** (FVE apod.).
3. **Smlouvy a dokumenty** – smlouva o dodávce, související smlouvy, další dokumenty (soubory).
4. **Obchodní podmínky** – nakoupená období (od–do, nákupní a prodejní cena, **marže se dopočítá**, stálá platba, od koho nakoupeno), stav dodatku a termín jeho uzavření. **Vidí jen role Obchod a Administrátor.**

V postranním panelu: stav OM, zahájení/ukončení dodávky, **„Nakoupeno do“** (konec posledního nakoupeného období) a upozornění, když do konce zbývá méně než 60 dní.

### Klíčová pravidla (vynucuje server, ne jen formulář)

- **Interní číslo** přiděluje databáze ze dvou samostatných řad (`EE-00001`, `ZP-00001`); je neměnné. Komoditu po založení OM nelze změnit.
- **Typ odběru, typ měření a distributor** se nabízejí podle komodity a server odmítne nesourodou kombinaci (např. elektřina + SO).
- **EAN** (18 číslic) a **EIC** (16 znaků) se kontrolují včetně kontrolní číslice; kód OM je unikátní.
- Nakoupená období se nesmí překrývat; marže a „nakoupeno do“ se počítají na serveru.
- Po změně typu odběru se parametry, které přestaly platit (např. VN → NN), vymažou.
- Každá změna OM, zákazníka a smlouvy se ukládá do **historie verzí**; u záznamů se eviduje, kdo je založil a kdo naposledy upravil.

## Role

| Role          | OM, zákazníci, smlouvy, dokumenty | Ceny a marže | Uživatelé |
| ------------- | --------------------------------- | ------------ | --------- |
| Administrátor | čtení, zápis, mazání              | ano          | správa    |
| Obchod        | čtení, zápis                      | ano          | –         |
| Operativa     | čtení, zápis                      | **ne**       | –         |
| Jen čtení     | čtení                             | **ne**       | –         |

Role přiděluje jen administrátor; posledního administrátora nelze smazat ani mu roli odebrat.
