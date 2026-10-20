/**
 * Číselníky modulu Energie – jediný zdroj pravdy.
 *
 * Hodnoty (`value`) jsou ukládány do databáze a používány v API → po nasazení je NEMĚNIT,
 * jen přidávat nové. Popisky (`label`) lze upravovat libovolně.
 */
import type { Option, OptionObject } from 'payload'

export const KOMODITY = ['EE', 'ZP'] as const
export type Komodita = (typeof KOMODITY)[number]

export const komodityOptions: OptionObject[] = [
  { label: 'Elektřina', value: 'EE' },
  { label: 'Plyn', value: 'ZP' },
]

/** Typ odběru je vázán na komoditu – mapa slouží pro filtrování nabídky i validaci. */
export const typyOdberu: Record<Komodita, OptionObject[]> = {
  EE: [
    { label: 'NN – nízké napětí', value: 'NN' },
    { label: 'VN – vysoké napětí', value: 'VN' },
  ],
  ZP: [
    { label: 'MO – maloodběr', value: 'MO' },
    { label: 'SO – střední odběr', value: 'SO' },
    { label: 'VO – velkoodběr', value: 'VO' },
  ],
}

/**
 * U plynu se typ odběru určuje z roční spotřeby (kategorie zákazníků na trhu s plynem):
 * MO do 630 MWh/rok včetně, SO nad 630 do 4 200 MWh/rok včetně, VO nad 4 200 MWh/rok.
 */
export const HRANICE_PLYN_MWH = { MO: 630, SO: 4200 } as const

export const typOdberuPlynuDleSpotreby = (rocniMwh: number): 'MO' | 'SO' | 'VO' =>
  rocniMwh <= HRANICE_PLYN_MWH.MO ? 'MO' : rocniMwh <= HRANICE_PLYN_MWH.SO ? 'SO' : 'VO'

/** Typ měření dle vyhlášky o pravidlech trhu – rovněž závisí na komoditě. */
export const typyMereni: Record<Komodita, OptionObject[]> = {
  EE: [
    { label: 'A – průběhové, dálkový přenos (typicky VN)', value: 'A' },
    { label: 'B – průběhové, dálkový přenos (NN)', value: 'B' },
    { label: 'C – neprůběhové', value: 'C' },
    { label: 'S – chytré měření (AMM)', value: 'S' },
  ],
  ZP: [
    { label: 'A – průběhové, denní dálkový přenos', value: 'A' },
    { label: 'B – průběhové, měsíční odečet', value: 'B' },
    { label: 'CM – neprůběhové, měsíční odečet', value: 'CM' },
    { label: 'C – neprůběhové, roční odečet', value: 'C' },
  ],
}

export const distributori: Record<Komodita, OptionObject[]> = {
  EE: [
    { label: 'ČEZ Distribuce', value: 'cez-distribuce' },
    { label: 'EG.D (elektřina)', value: 'egd-ee' },
    { label: 'PREdistribuce', value: 'predistribuce' },
    { label: 'Lokální distribuční soustava (LDS)', value: 'lds-ee' },
  ],
  ZP: [
    { label: 'GasNet', value: 'gasnet' },
    { label: 'EG.D (plyn)', value: 'egd-zp' },
    { label: 'Pražská plynárenská Distribuce', value: 'ppd' },
    { label: 'Lokální distribuční soustava (LDS)', value: 'lds-zp' },
  ],
}

/** Sloučené seznamy pro definici polí (DB enum musí znát všechny hodnoty). */
const vse = (mapa: Record<Komodita, OptionObject[]>): OptionObject[] => [...mapa.EE, ...mapa.ZP]
export const vsechnyTypyOdberu = vse(typyOdberu)
export const vsechnyTypyMereni = (() => {
  // A, B, C jsou společné hodnoty – deduplikace podle value, popisek generický.
  const unikatni = new Map<string, OptionObject>()
  for (const o of vse(typyMereni)) {
    if (!unikatni.has(String(o.value)))
      unikatni.set(String(o.value), { label: String(o.value), value: o.value })
  }
  return [...unikatni.values()]
})()
export const vsichniDistributori = vse(distributori)

/** Vrací nabídku hodnot pro danou komoditu; bez komodity nenabízí nic (uživatel ji musí vybrat první). */
export const moznostiProKomoditu =
  (mapa: Record<Komodita, OptionObject[]>) =>
  ({
    siblingData,
    data,
  }: {
    siblingData?: Record<string, unknown>
    data?: Record<string, unknown>
  }): Option[] => {
    const komodita = (siblingData?.komodita ?? data?.komodita) as Komodita | undefined
    return komodita ? mapa[komodita] : []
  }

export const jeHodnotaProKomoditu = (
  mapa: Record<Komodita, OptionObject[]>,
  komodita: unknown,
  hodnota: unknown,
): boolean =>
  typeof komodita === 'string' &&
  komodita in mapa &&
  mapa[komodita as Komodita].some((o) => o.value === hodnota)

export const obchodniModelOptions: OptionObject[] = [
  { label: 'Zákazník', value: 'zakaznik' },
  { label: 'Obchodník', value: 'obchodnik' },
]

/** Rozšiřitelný seznam – „…“ v zadání; doplňovat nové hodnoty na konec. */
export const typZakaznikaOptions: OptionObject[] = [
  { label: 'Běžný', value: 'bezny' },
  { label: 'Virtuální', value: 'virtualni' },
]

/** Sloučený typ OM pro seznam – kombinace typu zákazníka a spotřebitele. */
export const typOMOptions: OptionObject[] = [
  { label: 'Z – zákazník', value: 'Z' },
  { label: 'V – virtuální zákazník', value: 'V' },
  { label: 'Z-S – zákazník, spotřebitel', value: 'Z-S' },
  { label: 'V-S – virtuální zákazník, spotřebitel', value: 'V-S' },
]

export const typOM = (typZakaznika: unknown, spotrebitel: unknown): string | null => {
  if (typZakaznika !== 'bezny' && typZakaznika !== 'virtualni') return null
  return `${typZakaznika === 'virtualni' ? 'V' : 'Z'}${spotrebitel === 'ano' ? '-S' : ''}`
}

export const anoNeOptions: OptionObject[] = [
  { label: 'ANO', value: 'ano' },
  { label: 'NE', value: 'ne' },
]

export const stavOMOptions: OptionObject[] = [
  { label: 'Připravuje se', value: 'pripravovane' },
  { label: 'Aktivní dodávka', value: 'aktivni' },
  { label: 'Ukončeno', value: 'ukoncene' },
]

export const periodicitaOdectuOptions: OptionObject[] = [
  { label: 'Měsíční', value: 'mesicni' },
  { label: 'Čtvrtletní', value: 'ctvrtletni' },
  { label: 'Pololetní', value: 'pololetni' },
  { label: 'Roční', value: 'rocni' },
]

export const typCenyOptions: OptionObject[] = [
  { label: 'Fixní', value: 'fixni' },
  { label: 'Spotová (vázaná na OTE)', value: 'spot' },
  { label: 'Indexovaná / vzorcová', value: 'indexovana' },
]

export const stavDodatkuOptions: OptionObject[] = [
  { label: 'Není potřeba', value: 'nepotreba' },
  { label: 'Nutno připravit', value: 'pripravit' },
  { label: 'V jednání', value: 'jednani' },
  { label: 'Podepsán', value: 'podepsan' },
]

export const typSmlouvyOptions: OptionObject[] = [
  { label: 'Smlouva o dodávce', value: 'dodavka' },
  { label: 'Smlouva o připojení', value: 'pripojeni' },
  { label: 'Nájemní smlouva', value: 'najemni' },
  { label: 'Smlouva o nákupu elektřiny', value: 'nakup-ee' },
  { label: 'Smlouva o výkupu elektřiny (výrobna)', value: 'vykup-ee' },
  { label: 'Smlouva o zajištění služby distribuce', value: 'distribuce' },
  { label: 'Rámcová smlouva', value: 'ramcova' },
  { label: 'Jiná', value: 'jina' },
]

export const stavSmlouvyOptions: OptionObject[] = [
  { label: 'Koncept / v jednání', value: 'koncept' },
  { label: 'Platná', value: 'platna' },
  { label: 'Ukončená', value: 'ukoncena' },
]

export const typDokumentuOptions: OptionObject[] = [
  { label: 'Smlouva (sken/PDF)', value: 'smlouva' },
  { label: 'Dodatek ke smlouvě', value: 'dodatek' },
  { label: 'Plná moc', value: 'plna-moc' },
  { label: 'Revizní zpráva', value: 'revize' },
  { label: 'Technická dokumentace', value: 'technicka' },
  { label: 'Korespondence', value: 'korespondence' },
  { label: 'Jiný', value: 'jiny' },
]

export const napetovaHladinaOptions: OptionObject[] = [
  { label: '6 kV', value: '6' },
  { label: '10 kV', value: '10' },
  { label: '22 kV', value: '22' },
  { label: '35 kV', value: '35' },
]

/** Popisky jen zkratkou (FVE, KGJ…) – v seznamech i formulářích. */
export const druhVyrobnyOptions: OptionObject[] = [
  { label: 'FVE', value: 'fve' },
  { label: 'KGJ', value: 'kgj' },
  { label: 'MVE', value: 'mve' },
  { label: 'Jiná', value: 'jina' },
]

/** Krátké označení druhu výrobny pro přehledy („VN + FVE“). */
export const zkratkaVyrobny = (druh: unknown): string =>
  ({ fve: 'FVE', kgj: 'KGJ', mve: 'MVE' })[String(druh)] ?? 'výrobna'

export const kategorieVyrobnyOptions: OptionObject[] = [
  { label: '1. kategorie (bez dodávky do sítě / do 10,8 kW)', value: '1' },
  { label: '2. kategorie (s dodávkou do sítě)', value: '2' },
]

export const rezimPretokuOptions: OptionObject[] = [
  { label: 'S přetoky do sítě', value: 'pretoky' },
  { label: 'Bez přetoků (nulový přetok)', value: 'bez-pretoku' },
]

export const vykupPretokuOptions: OptionObject[] = [
  { label: 'Vykupuje BSE', value: 'bse' },
  { label: 'Vykupuje jiný obchodník', value: 'jiny' },
  { label: 'Bez výkupu', value: 'zadny' },
]

export const stavVyrobnyOptions: OptionObject[] = [
  { label: 'V provozu', value: 'provoz' },
  { label: 'Ve výstavbě / připojování', value: 'priprava' },
  { label: 'Mimo provoz', value: 'mimo-provoz' },
]

export const MESICE = [
  ['leden', 'Leden'],
  ['unor', 'Únor'],
  ['brezen', 'Březen'],
  ['duben', 'Duben'],
  ['kveten', 'Květen'],
  ['cerven', 'Červen'],
  ['cervenec', 'Červenec'],
  ['srpen', 'Srpen'],
  ['zari', 'Září'],
  ['rijen', 'Říjen'],
  ['listopad', 'Listopad'],
  ['prosinec', 'Prosinec'],
] as const

export const labelPro = (options: OptionObject[], value: unknown): string =>
  String(options.find((o) => o.value === value)?.label ?? value ?? '')
