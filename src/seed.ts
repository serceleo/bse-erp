/**
 * Ukázková data pro vývoj a testování administrace.
 *
 * Spuštění:  npm run seed
 * Skript odmítne běžet v produkci a do databáze, kde už nějaká OM jsou.
 * Všechny kódy jsou smyšlené (s dopočítanou platnou kontrolní číslicí).
 */
import 'dotenv/config'
import { getPayload } from 'payload'

import config from './payload.config'
import { kontrolniCisliceEAN, kontrolniZnakEIC } from './shared/validators/identifikatory'

const ean = (n: number) => {
  const z = `85918240099${String(n).padStart(6, '0')}`
  return z + kontrolniCisliceEAN(z)
}
const eic = (n: number) => {
  const z = `27ZG9900000${String(n).padStart(4, '0')}`
  return z + kontrolniZnakEIC(z)
}

const run = async () => {
  if (process.env.NODE_ENV === 'production') throw new Error('Seed nelze spustit v produkci.')

  const payload = await getPayload({ config })
  const existujici = await payload.count({ collection: 'odberna-mista', overrideAccess: true })
  if (existujici.totalDocs > 0) {
    payload.logger.warn('V databázi už odběrná místa jsou – seed přeskočen.')
    process.exit(0)
  }

  const uzivatele = await payload.count({ collection: 'users', overrideAccess: true })
  if (uzivatele.totalDocs === 0) {
    await payload.create({
      collection: 'users',
      overrideAccess: true,
      data: {
        email: 'admin@example.cz',
        password: 'Zmen-me-hned-123',
        jmeno: 'Administrátor',
        roles: ['admin'],
      },
    })
    payload.logger.info(
      'Založen uživatel admin@example.cz / Zmen-me-hned-123 – heslo po přihlášení změňte.',
    )
  }

  const vytvor = <T extends Parameters<typeof payload.create>[0]>(args: T) =>
    payload.create({ ...args, overrideAccess: true } as T)

  const lapac = await vytvor({
    collection: 'zakaznici',
    data: {
      nazev: 'Areál Na Lapači s.r.o.',
      typSubjektu: 'po',
      ico: '26463318',
      sidlo: { ulice: 'Na Lapači', cisloPopisne: '1200', obec: 'Vsetín', psc: '75501' },
      kontakt: { jmeno: 'Jan Novák', email: 'novak@example.cz' },
    },
  })
  const pekarna = await vytvor({
    collection: 'zakaznici',
    data: {
      nazev: 'Pekárna Zubří s.r.o.',
      typSubjektu: 'po',
      ico: '45274649',
      sidlo: { ulice: 'Hlavní', cisloPopisne: '375', obec: 'Zubří', psc: '75654' },
    },
  })
  const domacnost = await vytvor({
    collection: 'zakaznici',
    data: {
      nazev: 'Marie Svobodová',
      typSubjektu: 'fo',
      sidlo: { cisloPopisne: '12', obec: 'Hrachovec', psc: '75701' },
    },
  })

  const soubor = await vytvor({
    collection: 'soubory-om',
    data: { nazev: 'Areál Na Lapači', lokalita: 'Vsetín', vlastnikArealu: lapac.id },
  })

  const dodavka = await vytvor({
    collection: 'smlouvy',
    data: {
      cislo: 'D-2026/001',
      typ: 'dodavka',
      komodita: 'EE',
      stav: 'platna',
      zakaznik: lapac.id,
      platnostOd: '2026-01-01',
    },
  })
  const pripojeni = await vytvor({
    collection: 'smlouvy',
    data: {
      cislo: '12345678',
      typ: 'pripojeni',
      komodita: 'EE',
      stav: 'platna',
      protistrana: 'ČEZ Distribuce, a. s.',
    },
  })

  const zaklad = {
    obchodniModel: 'zakaznik',
    typZakaznika: 'bezny',
    stav: 'aktivni',
    zahajeniDodavky: '2026-01-01',
  } as const

  await vytvor({
    collection: 'odberna-mista',
    data: {
      ...zaklad,
      komodita: 'EE',
      typOdberu: 'VN',
      obchodniModel: 'obchodnik',
      spotrebitel: 'ne',
      zakaznik: lapac.id,
      souborOM: soubor.id,
      kod: ean(1),
      adresa: { ulice: 'Na Lapači', cisloPopisne: '1200', obec: 'Vsetín', psc: '75501' },
      odhadSpotreby: {
        rezim: 'mesicni',
        mesicni: {
          leden: 62,
          unor: 58,
          brezen: 55,
          duben: 48,
          kveten: 44,
          cerven: 41,
          cervenec: 40,
          srpen: 42,
          zari: 46,
          rijen: 52,
          listopad: 57,
          prosinec: 61,
        },
      },
      mereni: { typMereni: 'A', periodicitaOdectu: 'mesicni', distributor: 'cez-distribuce' },
      parametryVN: {
        napetovaHladina: '22',
        rezervovanyPrikonKw: 630,
        mereniNaStrane: 'VN',
        trafostanice: 'TS VS 9298 Na Lapači',
        vlastnikTrafostanice: 'my',
      },
      smlouvaODodavce: dodavka.id,
      souvisejiciSmlouvy: [pripojeni.id],
      obchod: {
        cenovaObdobi: [
          {
            od: '2026-01-01',
            do: '2026-12-31',
            typCeny: 'fixni',
            dodavatelNakupu: 'Dodavatel silové EE (příklad)',
            nakupniCena: 2450,
            prodejniCena: 2890,
            stalaPlatba: 150,
          },
        ],
        dodatek: { stav: 'pripravit', termin: '2026-11-30' },
      },
    },
  })

  const omPekarna = await vytvor({
    collection: 'odberna-mista',
    data: {
      ...zaklad,
      komodita: 'EE',
      typOdberu: 'NN',
      spotrebitel: 'ne',
      zakaznik: pekarna.id,
      kod: ean(2),
      adresa: { ulice: 'Hlavní', cisloPopisne: '375', obec: 'Zubří', psc: '75654' },
      odhadSpotreby: { rezim: 'rocni', rocniMwh: 38.5 },
      mereni: { typMereni: 'C', periodicitaOdectu: 'rocni', distributor: 'cez-distribuce' },
      parametryNN: { hlavniJistic: 80, pocetFazi: '3', distribucniSazba: 'C25d' },
    },
  })

  await vytvor({
    collection: 'vyrobny',
    data: {
      odberneMisto: omPekarna.id,
      druh: 'fve',
      kategorie: '2',
      stav: 'provoz',
      uvedeniDoProvozu: '2023-05-15',
      instalovanyVykonKwp: 29.9,
      rezervovanyVykonKw: 25,
      rezimPretoku: 'pretoky',
      vykupPretoku: 'bse',
      vykupniCena: 1200,
    },
  })

  await vytvor({
    collection: 'odberna-mista',
    data: {
      ...zaklad,
      komodita: 'ZP',
      typOdberu: 'MO',
      spotrebitel: 'ano',
      zakaznik: domacnost.id,
      kod: eic(1),
      adresa: { cisloPopisne: '12', obec: 'Hrachovec', psc: '75701' },
      odhadSpotreby: { rezim: 'rocni', rocniMwh: 18 },
      mereni: { typMereni: 'C', periodicitaOdectu: 'rocni', distributor: 'gasnet' },
    },
  })

  await vytvor({
    collection: 'odberna-mista',
    data: {
      ...zaklad,
      komodita: 'ZP',
      typOdberu: 'SO',
      spotrebitel: 'ne',
      zakaznik: lapac.id,
      souborOM: soubor.id,
      kod: eic(2),
      adresa: { ulice: 'Na Lapači', cisloPopisne: '1201', obec: 'Vsetín', psc: '75501' },
      odhadSpotreby: { rezim: 'rocni', rocniMwh: 950 },
      mereni: { typMereni: 'B', periodicitaOdectu: 'mesicni', distributor: 'gasnet' },
      parametryPlyn: { denniKapacitaM3: 1200, typKapacity: 'pevna' },
    },
  })

  payload.logger.info('Ukázková data založena (3 zákazníci, 1 soubor OM, 2 smlouvy, 4 OM, 1 FVE).')
  process.exit(0)
}

// Top-level await: `payload run` jinak po importu skriptu ukončí proces dřív, než seed doběhne.
try {
  await run()
} catch (e) {
  console.error(e)
  process.exit(1)
}
