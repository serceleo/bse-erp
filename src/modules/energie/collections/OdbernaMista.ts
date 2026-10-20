import type {
  CollectionBeforeChangeHook,
  CollectionConfig,
  Field,
  FieldHook,
  GroupField,
} from 'payload'

import {
  jenAdmin,
  maRoli,
  poleObchodniUdaje,
  prihlasen,
  ROLE,
  smiEditovatEvidenci,
} from '../../../shared/access/role'
import { adresaField, adresaNaRadek, type Adresa } from '../../../shared/fields/adresa'
import { auditFields, auditHook } from '../../../shared/fields/audit'
import { prazdneHodnoty } from '../../../shared/fields/prazdneHodnoty'
import {
  jePlatnyEAN18,
  jePlatnyEIC,
  normalizujKod,
} from '../../../shared/validators/identifikatory'
import {
  anoNeOptions,
  distributori,
  jeHodnotaProKomoditu,
  KOMODITY,
  komodityOptions,
  MESICE,
  moznostiProKomoditu,
  napetovaHladinaOptions,
  obchodniModelOptions,
  periodicitaOdectuOptions,
  stavDodatkuOptions,
  stavOMOptions,
  typCenyOptions,
  typyMereni,
  typyOdberu,
  HRANICE_PLYN_MWH,
  typOdberuPlynuDleSpotreby,
  typOM,
  typOMOptions,
  typZakaznikaOptions,
  vsechnyTypyMereni,
  vsechnyTypyOdberu,
  vsichniDistributori,
  type Komodita,
} from '../ciselniky'
import { pridelInterniCislo } from '../lib/ciselneRady'

// ─────────────────────────────────────────────────────────────────────────────
// Pomocné definice
// ─────────────────────────────────────────────────────────────────────────────

// Data hooků Payloadu jsou netypovaná (mohou být i částečná) – typujeme volně záměrně.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Data = Record<string, any>

const BUNKA_KOMODITA = '/modules/energie/admin/bunky#KomoditaBunka'
const BUNKA_ZKRATKA = '/modules/energie/admin/bunky#ZkratkaBunka'
const BUNKA_STAV = '/modules/energie/admin/bunky#StavBunka'

const datumDen = { date: { pickerAppearance: 'dayOnly', displayFormat: 'd. M. yyyy' } } as const
const zaokrouhli = (n: number, mista = 2) => Math.round(n * 10 ** mista) / 10 ** mista
const jeKomodita = (v: unknown): v is Komodita => KOMODITY.includes(v as Komodita)

/** Roční spotřeba z odhadu – při měsíčním režimu součet měsíců, jinak zadaná roční hodnota. */
const rocniSpotreba = (odhad: Data | null | undefined): number | null => {
  if (!odhad) return null
  const zadana = typeof odhad.rocniMwh === 'number' ? odhad.rocniMwh : null
  if (odhad.rezim !== 'mesicni') return zadana
  const mesice = (odhad.mesicni ?? {}) as Record<string, number | null>
  const hodnoty = MESICE.map(([klic]) => mesice[klic]).filter(
    (v): v is number => typeof v === 'number',
  )
  const soucet = hodnoty.length
    ? zaokrouhli(
        hodnoty.reduce((a, b) => a + b, 0),
        3,
      )
    : null
  // Úplný profil (všech 12 měsíců) určuje roční spotřebu sám. U neúplného profilu
  // (např. nové OM s historií jen za pár měsíců) platí ručně zadaný roční odhad.
  if (hodnoty.length === MESICE.length) return soucet
  return zadana ?? soucet
}

/** Podmínky zobrazení variantních údajů – na jednom místě, používají je pole i hook. */
const varianta = {
  jeEE: (d: Data) => d?.komodita === 'EE',
  jeNN: (d: Data) => d?.komodita === 'EE' && d?.typOdberu === 'NN',
  jeVN: (d: Data) => d?.komodita === 'EE' && d?.typOdberu === 'VN',
  jePlynSOVO: (d: Data) => d?.komodita === 'ZP' && ['SO', 'VO'].includes(d?.typOdberu),
}

/** Validace výběru, jehož nabídka závisí na komoditě (typ odběru, typ měření, distributor). */
const validujProKomoditu =
  (mapa: Parameters<typeof jeHodnotaProKomoditu>[0], povinne: boolean) =>
  (value: unknown, { data }: { data: Partial<Data> }) => {
    if (value === null || value === undefined || value === '')
      return povinne ? 'Toto pole je povinné.' : true
    return (
      jeHodnotaProKomoditu(mapa, data?.komodita, value) || 'Hodnota neodpovídá zvolené komoditě.'
    )
  }

// ─────────────────────────────────────────────────────────────────────────────
// Hooky
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Odvozené hodnoty, které nesmí přijít od klienta: interní číslo, jednořádková adresa,
 * označení pro výběry, konec nakoupeného období. Při update pracujeme se sloučenými daty,
 * protože API smí poslat jen část dokumentu.
 */
const odvozeneHodnoty: CollectionBeforeChangeHook = async ({
  data,
  operation,
  originalDoc,
  req,
}) => {
  if (operation === 'create') {
    if (jeKomodita(data.komodita))
      data.interniCislo = await pridelInterniCislo(req.payload, data.komodita)
  } else {
    // Interní číslo i komodita jsou po založení neměnné (komodita určuje číselnou řadu).
    data.interniCislo = originalDoc?.interniCislo
    data.komodita = originalDoc?.komodita
  }

  const d: Data = { ...(originalDoc ?? {}), ...data }
  d.odhadSpotreby = { ...(originalDoc?.odhadSpotreby ?? {}), ...(data.odhadSpotreby ?? {}) }

  // Plyn: typ odběru (MO/SO/VO) určuje roční spotřeba, pokud je známá.
  const rocni = rocniSpotreba(d.odhadSpotreby)
  if (d.komodita === 'ZP' && rocni !== null) {
    data.typOdberu = d.typOdberu = typOdberuPlynuDleSpotreby(rocni)
  }

  if (typeof data.kod === 'string') data.kod = normalizujKod(data.kod)

  data.adresaText = adresaNaRadek(d.adresa as Adresa)
  data.typ = typOM(d.typZakaznika, d.spotrebitel)
  data.oznaceni = [data.interniCislo, data.adresaText || data.kod || d.kod]
    .filter(Boolean)
    .join(' – ')

  // Variantní údaje, které po změně typu odběru přestaly dávat smysl, nenecháváme v datech viset.
  if (!varianta.jeNN(d)) data.parametryNN = prazdnaSkupina('parametryNN')
  if (!varianta.jeVN(d)) data.parametryVN = prazdnaSkupina('parametryVN')
  if (!varianta.jePlynSOVO(d)) data.parametryPlyn = prazdnaSkupina('parametryPlyn')
  if (!varianta.jeEE(d)) data.vyrobna = prazdnaSkupina('vyrobna')
  else if (d.vyrobna && !d.vyrobna.maVyrobnu) data.vyrobna = prazdnaSkupina('vyrobna')

  // Konec nakoupeného období počítáme jen z obchodních údajů, které uživatel smí měnit
  // a skutečně poslal – jinak zůstává původní hodnota (nelze ji podvrhnout přes API).
  // Bez přihlášeného uživatele sem vede jen serverový kód (Local API – seed, import, úlohy);
  // přes HTTP se nepřihlášený k zápisu nedostane (kolekční access).
  const smiObchodniUdaje = req.user
    ? maRoli(req.user, ROLE.admin, ROLE.obchod)
    : req.payloadAPI === 'local'
  const obdobi = data.obchod?.cenovaObdobi as Data[] | undefined
  if (smiObchodniUdaje && Array.isArray(obdobi)) {
    const konce = obdobi
      .map((o) => o?.do)
      .filter(Boolean)
      .map((x) => new Date(x).getTime())
    data.nakoupenoDo = konce.length ? new Date(Math.max(...konce)).toISOString() : null
  } else {
    data.nakoupenoDo = originalDoc?.nakoupenoDo ?? null
  }

  return data
}

/** Prázdné hodnoty variantní skupiny (definice skupin jsou níže v `spotrebaAMereni`). */
const prazdnaSkupina = (nazev: string) => {
  const skupina = spotrebaAMereni.find(
    (f): f is GroupField => f.type === 'group' && 'name' in f && f.name === nazev,
  )
  if (!skupina) throw new Error(`Neznámá skupina ${nazev}`)
  return prazdneHodnoty(skupina.fields)
}

const spoctiMarzi: FieldHook = ({ siblingData }) => {
  const { nakupniCena: n, prodejniCena: p } = siblingData ?? {}
  return typeof n === 'number' && typeof p === 'number' ? zaokrouhli(p - n) : null
}

const spoctiRocniSpotrebu: FieldHook = ({ siblingData, value }) =>
  siblingData?.rezim === 'mesicni' ? rocniSpotreba({ ...siblingData, rocniMwh: value }) : value

/** Upozornění (počítané při čtení) – kolik zbývá do konce nakoupeného období. */
const upozorneniNaKonecNakupu: FieldHook = ({ siblingData }) => {
  const zpravy: string[] = []
  if (!siblingData?.zakaznik) zpravy.push('Chybí zákazník – doplňte smluvního partnera.')
  const konec = siblingData?.nakoupenoDo ? new Date(siblingData.nakoupenoDo) : null
  if (konec && siblingData?.stav !== 'ukoncene') {
    const dni = Math.ceil((konec.getTime() - Date.now()) / 86_400_000)
    if (dni < 0) zpravy.push(`Nákup skončil před ${-dni} dny – zajistit pokrytí!`)
    else if (dni <= 60) zpravy.push(`Nákup končí za ${dni} dní – zkontrolovat dodatek.`)
  }
  return zpravy.length ? zpravy.join(' ') : null
}

// ─────────────────────────────────────────────────────────────────────────────
// Skupina 1 – základní údaje (zobrazují se i v seznamu)
// ─────────────────────────────────────────────────────────────────────────────

const zakladniUdaje: Field[] = [
  {
    type: 'row',
    fields: [
      {
        name: 'komodita',
        label: 'Komodita',
        type: 'select',
        required: true,
        index: true,
        options: komodityOptions,
        // Komoditu nelze po založení změnit – určuje číselnou řadu interního čísla.
        access: { update: () => false },
        admin: {
          width: '25%',
          description: 'Po uložení nelze změnit.',
          components: { Cell: BUNKA_KOMODITA },
        },
      },
      {
        name: 'typOdberu',
        label: 'Typ odběru',
        type: 'select',
        index: true,
        options: vsechnyTypyOdberu,
        filterOptions: moznostiProKomoditu(typyOdberu),
        // Povinný – kromě plynu se známou spotřebou, kde ho určí server sám (viz odvozeneHodnoty).
        validate: (value: unknown, args: { data: Partial<Data> }) => {
          const plynSeSpotrebou =
            args.data?.komodita === 'ZP' && rocniSpotreba(args.data?.odhadSpotreby) !== null
          if (plynSeSpotrebou) return true
          return validujProKomoditu(typyOdberu, true)(value, args)
        },
        admin: {
          width: '25%',
          description: `Plyn: určí se z roční spotřeby (MO do ${HRANICE_PLYN_MWH.MO} MWh, SO do ${HRANICE_PLYN_MWH.SO.toLocaleString('cs-CZ')} MWh, VO nad).`,
          components: { Cell: BUNKA_ZKRATKA },
        },
      },
      {
        name: 'obchodniModel',
        label: 'Model BSE',
        type: 'select',
        required: true,
        options: obchodniModelOptions,
        admin: { width: '25%' },
      },
      {
        name: 'typZakaznika',
        label: 'Typ zákazníka',
        type: 'select',
        required: true,
        defaultValue: 'bezny',
        options: typZakaznikaOptions,
        admin: { width: '25%' },
      },
    ],
  },
  {
    type: 'row',
    fields: [
      {
        name: 'zakaznik',
        label: 'Zákazník (smluvní partner)',
        type: 'relationship',
        relationTo: 'zakaznici',
        // Nepovinný: OM převzaté od distributora se zakládají dřív, než je známý smluvní partner.
        // Chybějící zákazník se hlásí v postranním panelu (pole Upozornění).
        index: true,
        admin: { width: '40%' },
      },
      {
        name: 'souborOM',
        label: 'Soubor OM',
        type: 'relationship',
        relationTo: 'soubory-om',
        index: true,
        admin: { width: '35%' },
      },
      {
        name: 'spotrebitel',
        label: 'Spotřebitel',
        type: 'select',
        required: true,
        defaultValue: 'ne',
        options: anoNeOptions,
        admin: { width: '25%' },
      },
    ],
  },
  {
    name: 'kod',
    label: 'Kód OM (EAN / EIC)',
    type: 'text',
    required: true,
    unique: true,
    index: true,
    admin: {
      description:
        'Elektřina: EAN – 18 číslic (859182400…). Plyn: EIC – 16 znaků (27ZG…). Mezery se odstraní.',
    },
    validate: (value: unknown, { data }: { data: Partial<Data> }) => {
      if (!value || typeof value !== 'string') return 'Kód OM je povinný.'
      if (data?.komodita === 'EE')
        return jePlatnyEAN18(value) || 'Neplatný EAN (18 číslic, nesedí kontrolní číslice).'
      if (data?.komodita === 'ZP')
        return jePlatnyEIC(value) || 'Neplatný EIC (16 znaků, nesedí kontrolní znak).'
      return 'Nejprve zvolte komoditu.'
    },
  },
  adresaField({ label: 'Adresa OM' }),
  {
    name: 'adresaText',
    label: 'Adresa',
    type: 'text',
    index: true,
    admin: { hidden: true },
  },
  { name: 'poznamka', label: 'Poznámka', type: 'textarea' },
]

// ─────────────────────────────────────────────────────────────────────────────
// Skupina 2 – detail: spotřeba, měření, varianty dle typu odběru
// ─────────────────────────────────────────────────────────────────────────────

const spotrebaAMereni: Field[] = [
  {
    name: 'odhadSpotreby',
    label: 'Odhadovaná spotřeba',
    type: 'group',
    fields: [
      {
        type: 'row',
        fields: [
          {
            name: 'rezim',
            enumName: 'om_odhad_rezim',
            label: 'Odhad zadávám',
            type: 'select',
            required: true,
            defaultValue: 'rocni',
            options: [
              { label: 'Ročně (menší odběry)', value: 'rocni' },
              { label: 'Po měsících', value: 'mesicni' },
            ],
            admin: { width: '40%' },
          },
          {
            name: 'rocniMwh',
            label: 'Roční spotřeba [MWh]',
            type: 'number',
            min: 0,
            hooks: { beforeChange: [spoctiRocniSpotrebu] },
            admin: {
              width: '30%',
              step: 0.001,
              description:
                'Při zadání všech 12 měsíců se dopočítá jako jejich součet; u neúplného profilu zadejte roční odhad ručně.',
            },
          },
        ],
      },
      {
        name: 'mesicni',
        label: 'Měsíční odhad [MWh]',
        type: 'group',
        admin: { condition: (_, s) => s?.rezim === 'mesicni' },
        fields: [0, 1, 2].map((ctvrtina) => ({
          type: 'row' as const,
          fields: MESICE.slice(ctvrtina * 4, ctvrtina * 4 + 4).map(([name, label]) => ({
            name,
            label,
            type: 'number' as const,
            min: 0,
            admin: { width: '25%', step: 0.001 },
          })),
        })),
      },
    ],
  },
  {
    name: 'mereni',
    label: 'Měření a distribuce',
    type: 'group',
    fields: [
      {
        type: 'row',
        fields: [
          {
            name: 'typMereni',
            enumName: 'om_typ_mereni',
            label: 'Typ měření',
            type: 'select',
            options: vsechnyTypyMereni,
            filterOptions: moznostiProKomoditu(typyMereni),
            validate: validujProKomoditu(typyMereni, false),
            admin: { width: '35%' },
          },
          {
            name: 'periodicitaOdectu',
            enumName: 'om_periodicita',
            label: 'Periodicita odečtu',
            type: 'select',
            options: periodicitaOdectuOptions,
            admin: { width: '30%' },
          },
          {
            name: 'cisloMeridla',
            label: 'Číslo měřidla',
            type: 'text',
            admin: { width: '35%' },
          },
        ],
      },
      {
        type: 'row',
        fields: [
          {
            name: 'distributor',
            enumName: 'om_distributor',
            label: 'Distributor',
            type: 'select',
            options: vsichniDistributori,
            filterOptions: moznostiProKomoditu(distributori),
            validate: validujProKomoditu(distributori, false),
            admin: { width: '50%' },
          },
          {
            name: 'nazevLDS',
            label: 'Provozovatel LDS',
            type: 'text',
            admin: {
              width: '50%',
              condition: (_, s) =>
                typeof s?.distributor === 'string' && s.distributor.startsWith('lds'),
            },
          },
        ],
      },
    ],
  },
  {
    name: 'parametryNN',
    label: 'Parametry odběru NN',
    type: 'group',
    admin: { condition: (d) => varianta.jeNN(d) },
    fields: [
      {
        type: 'row',
        fields: [
          {
            name: 'hlavniJistic',
            label: 'Hlavní jistič [A]',
            type: 'number',
            min: 0,
            admin: { width: '25%' },
          },
          {
            name: 'pocetFazi',
            enumName: 'om_pocet_fazi',
            label: 'Počet fází',
            type: 'select',
            options: [
              { label: '1', value: '1' },
              { label: '3', value: '3' },
            ],
            admin: { width: '25%' },
          },
          {
            name: 'distribucniSazba',
            label: 'Distribuční sazba',
            type: 'text',
            admin: { width: '25%', placeholder: 'např. C25d' },
          },
        ],
      },
    ],
  },
  {
    name: 'parametryVN',
    label: 'Parametry odběru VN',
    type: 'group',
    admin: { condition: (d) => varianta.jeVN(d) },
    fields: [
      {
        type: 'row',
        fields: [
          {
            name: 'napetovaHladina',
            enumName: 'om_napeti',
            label: 'Napěťová hladina',
            type: 'select',
            options: napetovaHladinaOptions,
            admin: { width: '33%' },
          },
          {
            name: 'rezervovanyPrikonKw',
            label: 'Rezervovaný příkon [kW]',
            type: 'number',
            min: 0,
            admin: { width: '33%' },
          },
          {
            name: 'mereniNaStrane',
            enumName: 'om_mereni_strana',
            label: 'Měření na straně',
            type: 'select',
            options: [
              { label: 'VN', value: 'VN' },
              { label: 'NN (s přepočtem ztrát)', value: 'NN' },
            ],
            admin: { width: '34%' },
          },
        ],
      },
      {
        type: 'row',
        fields: [
          {
            name: 'trafostanice',
            label: 'Trafostanice',
            type: 'text',
            admin: { width: '50%', placeholder: 'např. DTS_VS_9184' },
          },
          {
            name: 'vlastnikTrafostanice',
            enumName: 'om_vlastnik_ts',
            label: 'Vlastník trafostanice',
            type: 'select',
            options: [
              { label: 'Zákazník', value: 'zakaznik' },
              { label: 'Distributor', value: 'distributor' },
              { label: 'Naše společnost', value: 'my' },
              { label: 'Jiný', value: 'jiny' },
            ],
            admin: { width: '50%' },
          },
        ],
      },
    ],
  },
  {
    name: 'parametryPlyn',
    label: 'Parametry odběru plynu (SO/VO)',
    type: 'group',
    admin: { condition: (d) => varianta.jePlynSOVO(d) },
    fields: [
      {
        type: 'row',
        fields: [
          {
            name: 'denniKapacitaM3',
            label: 'Denní rezervovaná kapacita [m³/den]',
            type: 'number',
            min: 0,
            admin: { width: '50%' },
          },
          {
            name: 'typKapacity',
            enumName: 'om_typ_kapacity',
            label: 'Typ kapacity',
            type: 'select',
            options: [
              { label: 'Pevná', value: 'pevna' },
              { label: 'Klouzavá', value: 'klouzava' },
            ],
            admin: { width: '50%' },
          },
        ],
      },
    ],
  },
  {
    name: 'vyrobna',
    label: 'Výrobna v místě (FVE apod.)',
    type: 'group',
    admin: { condition: (d) => varianta.jeEE(d) },
    fields: [
      {
        name: 'maVyrobnu',
        label: 'V odběrném místě je výrobna',
        type: 'checkbox',
        defaultValue: false,
      },
      {
        type: 'row',
        admin: { condition: (_, s) => Boolean(s?.maVyrobnu) },
        fields: [
          {
            name: 'druh',
            enumName: 'om_druh_vyrobny',
            label: 'Druh',
            type: 'select',
            options: [
              { label: 'FVE', value: 'fve' },
              { label: 'Kogenerace', value: 'kgj' },
              { label: 'Jiná', value: 'jina' },
            ],
            admin: { width: '33%' },
          },
          {
            name: 'instalovanyVykonKwp',
            label: 'Instalovaný výkon [kWp]',
            type: 'number',
            min: 0,
            admin: { width: '33%' },
          },
          {
            name: 'rezervovanyVykonKw',
            label: 'Rezervovaný výkon [kW]',
            type: 'number',
            min: 0,
            admin: { width: '34%' },
          },
        ],
      },
    ],
  },
]

const smlouvyADokumenty: Field[] = [
  {
    name: 'smlouvaODodavce',
    label: 'Smlouva o dodávce',
    type: 'relationship',
    relationTo: 'smlouvy',
    index: true,
    filterOptions: { typ: { equals: 'dodavka' } },
    admin: {
      description: 'Soubor smlouvy se nahrává v evidenci smluv; zde se smlouva jen vybere.',
    },
  },
  {
    name: 'souvisejiciSmlouvy',
    label: 'Související smlouvy (připojení, nájem, nákup, výkup…)',
    type: 'relationship',
    relationTo: 'smlouvy',
    hasMany: true,
    filterOptions: { typ: { not_equals: 'dodavka' } },
  },
  {
    name: 'dalsiDokumenty',
    label: 'Další dokumenty (plná moc, revize…)',
    type: 'upload',
    relationTo: 'dokumenty',
    hasMany: true,
  },
]

const obchodniPodminky: Field[] = [
  {
    name: 'obchod',
    label: false,
    type: 'group',
    // Ceny a marže jsou obchodní tajemství – čtení i změna jen pro roli Obchod a Admin.
    access: { read: poleObchodniUdaje, create: poleObchodniUdaje, update: poleObchodniUdaje },
    fields: [
      {
        name: 'cenovaObdobi',
        label: 'Nakoupená období a ceny',
        labels: { singular: 'Období', plural: 'Období' },
        type: 'array',
        admin: { initCollapsed: false },
        validate: (rows: unknown) => {
          if (!Array.isArray(rows)) return true
          const obdobi = rows
            .filter((r) => r?.od && r?.do)
            .map((r) => ({ od: new Date(r.od).getTime(), do: new Date(r.do).getTime() }))
            .sort((a, b) => a.od - b.od)
          for (let i = 1; i < obdobi.length; i++) {
            if (obdobi[i].od <= obdobi[i - 1].do) return 'Nakoupená období se nesmí překrývat.'
          }
          return true
        },
        fields: [
          {
            type: 'row',
            fields: [
              {
                name: 'od',
                label: 'Období od',
                type: 'date',
                required: true,
                admin: { width: '25%', ...datumDen },
              },
              {
                name: 'do',
                label: 'Období do',
                type: 'date',
                required: true,
                admin: { width: '25%', ...datumDen },
                validate: (value: unknown, { siblingData }: { siblingData: Partial<Data> }) =>
                  !value ||
                  !siblingData?.od ||
                  new Date(value as string) >= new Date(siblingData.od) ||
                  'Konec období nesmí předcházet začátku.',
              },
              {
                name: 'typCeny',
                enumName: 'om_typ_ceny',
                label: 'Typ ceny',
                type: 'select',
                required: true,
                defaultValue: 'fixni',
                options: typCenyOptions,
                admin: { width: '25%' },
              },
              {
                name: 'dodavatelNakupu',
                label: 'Nakoupeno od',
                type: 'text',
                admin: { width: '25%' },
              },
            ],
          },
          {
            type: 'row',
            fields: [
              {
                name: 'nakupniCena',
                label: 'Nákupní cena [Kč/MWh]',
                type: 'number',
                min: 0,
                admin: { width: '25%', step: 0.01 },
              },
              {
                name: 'prodejniCena',
                label: 'Prodejní cena [Kč/MWh]',
                type: 'number',
                min: 0,
                admin: { width: '25%', step: 0.01 },
              },
              {
                name: 'marze',
                label: 'Marže [Kč/MWh]',
                type: 'number',
                hooks: { beforeChange: [spoctiMarzi] },
                admin: { width: '25%', readOnly: true, description: 'Dopočítá se při uložení.' },
              },
              {
                name: 'stalaPlatba',
                label: 'Stálá platba [Kč/měsíc]',
                type: 'number',
                min: 0,
                admin: { width: '25%', step: 0.01 },
              },
            ],
          },
          { name: 'poznamka', label: 'Poznámka k období', type: 'text' },
        ],
      },
      {
        name: 'dodatek',
        label: 'Dodatek před koncem období',
        type: 'group',
        fields: [
          {
            type: 'row',
            fields: [
              {
                name: 'stav',
                enumName: 'om_stav_dodatku',
                label: 'Stav dodatku',
                type: 'select',
                defaultValue: 'nepotreba',
                options: stavDodatkuOptions,
                admin: { width: '33%' },
              },
              {
                name: 'termin',
                label: 'Uzavřít do',
                type: 'date',
                admin: { width: '33%', ...datumDen },
              },
              { name: 'poznamka', label: 'Poznámka', type: 'text', admin: { width: '34%' } },
            ],
          },
        ],
      },
      { name: 'poznamka', label: 'Další ujednání ze smlouvy', type: 'textarea' },
    ],
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// Kolekce
// ─────────────────────────────────────────────────────────────────────────────

export const OdbernaMista: CollectionConfig = {
  slug: 'odberna-mista',
  labels: { singular: 'Odběrné místo', plural: 'Odběrná místa' },
  admin: {
    useAsTitle: 'oznaceni',
    // Seznam = údaje „skupiny 1“; vše ostatní až v detailu.
    defaultColumns: [
      'interniCislo',
      'komodita',
      'obchodniModel',
      'souborOM',
      'zakaznik',
      'typ',
      'kod',
      'adresaText',
      'stav',
    ],
    listSearchableFields: ['interniCislo', 'kod', 'adresaText'],
    group: 'Energie',
    pagination: { defaultLimit: 50 },
  },
  defaultSort: 'interniCislo',
  access: {
    read: prihlasen,
    create: smiEditovatEvidenci,
    update: smiEditovatEvidenci,
    delete: jenAdmin, // běžně se OM neodstraňuje, ale ukončuje (stav „Ukončeno“)
  },
  versions: { maxPerDoc: 100 },
  hooks: {
    beforeChange: [auditHook, odvozeneHodnoty],
  },
  indexes: [{ fields: ['komodita', 'stav'] }],
  fields: [
    // ── Postranní panel ──
    {
      name: 'interniCislo',
      label: 'Číslo OM',
      type: 'text',
      unique: true,
      index: true,
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Přidělí se automaticky při založení (řada EE / ZP).',
      },
    },
    { name: 'oznaceni', type: 'text', admin: { hidden: true } },
    {
      // Sloučený údaj pro seznam: Z / V (běžný / virtuální zákazník), přípona -S = spotřebitel.
      // Odvozuje server z polí typZakaznika a spotrebitel, která zůstávají zdrojem pravdy.
      name: 'typ',
      label: 'Typ',
      type: 'select',
      enumName: 'om_typ',
      index: true,
      options: typOMOptions,
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Odvozeno z typu zákazníka a spotřebitele.',
        components: { Cell: BUNKA_ZKRATKA },
      },
    },
    {
      name: 'stav',
      label: 'Stav',
      type: 'select',
      required: true,
      defaultValue: 'pripravovane',
      options: stavOMOptions,
      admin: { position: 'sidebar', components: { Cell: BUNKA_STAV } },
    },
    {
      name: 'zahajeniDodavky',
      label: 'Zahájení dodávky',
      type: 'date',
      admin: { position: 'sidebar', ...datumDen },
    },
    {
      name: 'ukonceniDodavky',
      label: 'Ukončení dodávky',
      type: 'date',
      admin: { position: 'sidebar', ...datumDen },
    },
    {
      name: 'nakoupenoDo',
      label: 'Nakoupeno do',
      type: 'date',
      index: true,
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Konec posledního nakoupeného období.',
        ...datumDen,
      },
    },
    {
      name: 'upozorneni',
      label: 'Upozornění',
      type: 'text',
      virtual: true,
      hooks: { afterRead: [upozorneniNaKonecNakupu] },
      admin: { position: 'sidebar', readOnly: true, condition: (_, s) => Boolean(s?.upozorneni) },
    },
    ...auditFields,

    // ── Hlavní část ──
    {
      type: 'tabs',
      tabs: [
        { label: 'Základní údaje', fields: zakladniUdaje },
        { label: 'Spotřeba a technické údaje', fields: spotrebaAMereni },
        { label: 'Smlouvy a dokumenty', fields: smlouvyADokumenty },
        {
          label: 'Obchodní podmínky',
          description:
            'Ceny, marže a nakoupená období. Viditelné jen pro role Obchod a Administrátor.',
          fields: obchodniPodminky,
        },
      ],
    },
  ],
}
