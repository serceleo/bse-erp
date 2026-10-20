import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  CollectionBeforeChangeHook,
  CollectionConfig,
} from 'payload'

import {
  jenAdmin,
  poleObchodniUdaje,
  prihlasen,
  smiEditovatEvidenci,
} from '../../../shared/access/role'
import { adresaNaRadek, type Adresa } from '../../../shared/fields/adresa'
import { auditFields, auditHook } from '../../../shared/fields/audit'
import { jePlatnyEAN18, normalizujKod } from '../../../shared/validators/identifikatory'
import {
  druhVyrobnyOptions,
  kategorieVyrobnyOptions,
  rezimPretokuOptions,
  stavVyrobnyOptions,
  typyMereni,
  vykupPretokuOptions,
  zkratkaVyrobny,
} from '../ciselniky'

const datumDen = { date: { pickerAppearance: 'dayOnly', displayFormat: 'd. M. yyyy' } } as const
const idZ = (v: unknown) =>
  (v && typeof v === 'object' ? (v as { id: unknown }).id : v) as number | null | undefined

/**
 * Odvozené hodnoty z OM: označení výrobny (vlastní název, jinak „FVE – Pivovarská 30,
 * Rožnov pod Radhoštěm“) a spotřební EAN OM. Klientem zaslané hodnoty se přepisují.
 */
const odvozeneZOM: CollectionBeforeChangeHook = async ({ data, originalDoc, req }) => {
  const d = { ...(originalDoc ?? {}), ...data }
  if (typeof data.ean === 'string') data.ean = normalizujKod(data.ean)
  const omId = idZ(d.odberneMisto)
  const om = omId
    ? await req.payload
        .findByID({ collection: 'odberna-mista', id: omId, depth: 0, overrideAccess: true, req })
        .catch(() => null)
    : null
  const adresa = om ? adresaNaRadek(om.adresa as Adresa, { psc: false }) : ''
  data.oznaceni = d.nazev?.trim() || [zkratkaVyrobny(d.druh), adresa].filter(Boolean).join(' – ')
  data.eanOdberu = om?.kod ?? null
  // Název obchodníka se vede jen u volby „Jiný obchodník“.
  if (d.vykupPretoku !== 'jiny') data.vykupujici = null
  return data
}

/**
 * Přepočte u OM souhrn připojených výroben (pole `vyrobny` – např. „FVE“), který se
 * zobrazuje v přehledu OM („VN + FVE“). Volá se po každé změně či smazání výrobny,
 * u přesunu výrobny i pro původní OM.
 */
export const prepocitejVyrobnyOM = async (
  req: Parameters<CollectionAfterChangeHook>[0]['req'],
  omId: number | null | undefined,
) => {
  if (!omId) return
  const vyrobny = await req.payload.find({
    collection: 'vyrobny',
    where: { odberneMisto: { equals: omId } },
    depth: 0,
    pagination: false,
    overrideAccess: true,
    req,
  })
  const souhrn = [...new Set(vyrobny.docs.map((v) => zkratkaVyrobny(v.druh)))].join(', ') || null
  const om = await req.payload
    .findByID({ collection: 'odberna-mista', id: omId, depth: 0, overrideAccess: true, req })
    .catch(() => null)
  if (om && (om.vyrobny ?? null) !== souhrn) {
    await req.payload.update({
      collection: 'odberna-mista',
      id: omId,
      data: {},
      context: { souhrnVyroben: souhrn },
      depth: 0,
      overrideAccess: true,
      req,
    })
  }
}

const poZmene: CollectionAfterChangeHook = async ({ doc, previousDoc, req }) => {
  await prepocitejVyrobnyOM(req, idZ(doc.odberneMisto))
  const predtim = idZ(previousDoc?.odberneMisto)
  if (predtim && predtim !== idZ(doc.odberneMisto)) await prepocitejVyrobnyOM(req, predtim)
  return doc
}

const poSmazani: CollectionAfterDeleteHook = async ({ doc, req }) => {
  await prepocitejVyrobnyOM(req, idZ(doc.odberneMisto))
}

/**
 * Výrobny elektřiny (FVE, KGJ…) připojené k odběrným místům. Samostatná evidence;
 * v detailu OM je zobrazena na záložce „Výrobna (FVE)“.
 */
export const Vyrobny: CollectionConfig = {
  slug: 'vyrobny',
  labels: { singular: 'Výrobna', plural: 'Výrobny (FVE)' },
  admin: {
    useAsTitle: 'oznaceni',
    defaultColumns: [
      'oznaceni',
      'druh',
      'odberneMisto',
      'eanOdberu',
      'ean',
      'instalovanyVykonKwp',
      'vykupPretoku',
      'stav',
    ],
    listSearchableFields: ['oznaceni', 'ean', 'eanOdberu', 'licenceEru'],
    group: 'Energie',
  },
  access: {
    read: prihlasen,
    create: smiEditovatEvidenci,
    update: smiEditovatEvidenci,
    delete: jenAdmin,
  },
  versions: { maxPerDoc: 50 },
  hooks: {
    beforeChange: [auditHook, odvozeneZOM],
    afterChange: [poZmene],
    afterDelete: [poSmazani],
  },
  fields: [
    { name: 'oznaceni', type: 'text', admin: { hidden: true } },
    {
      name: 'stav',
      label: 'Stav',
      type: 'select',
      enumName: 'vyr_stav',
      required: true,
      defaultValue: 'provoz',
      options: stavVyrobnyOptions,
      admin: { position: 'sidebar' },
    },
    {
      name: 'uvedeniDoProvozu',
      label: 'Uvedení do provozu',
      type: 'date',
      admin: { position: 'sidebar', ...datumDen },
    },
    ...auditFields,
    {
      type: 'row',
      fields: [
        {
          name: 'odberneMisto',
          label: 'Odběrné místo',
          type: 'relationship',
          relationTo: 'odberna-mista',
          required: true,
          index: true,
          filterOptions: { komodita: { equals: 'EE' } },
          admin: { width: '50%' },
        },
        {
          name: 'druh',
          label: 'Druh výrobny',
          type: 'select',
          enumName: 'vyr_druh',
          required: true,
          defaultValue: 'fve',
          options: druhVyrobnyOptions,
          admin: { width: '25%' },
        },
        {
          name: 'kategorie',
          label: 'Kategorie výroby',
          type: 'select',
          enumName: 'vyr_kategorie',
          options: kategorieVyrobnyOptions,
          admin: { width: '25%' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'eanOdberu',
          label: 'Spotřební EAN (OM)',
          type: 'text',
          index: true,
          admin: {
            width: '50%',
            readOnly: true,
            description: 'EAN odběru přiřazeného OM – doplní se automaticky.',
          },
        },
        {
          name: 'ean',
          label: 'Výrobní EAN',
          type: 'text',
          unique: true,
          index: true,
          admin: { width: '50%', description: 'EAN výroby (18 číslic), odlišný od EAN odběru.' },
          validate: (value: string | null | undefined) =>
            !value || jePlatnyEAN18(value) || 'Neplatný EAN (18 číslic, nesedí kontrolní číslice).',
        },
      ],
    },
    {
      name: 'nazev',
      label: 'Vlastní název',
      type: 'text',
      admin: { description: 'Nepovinné – jinak se použije druh a adresa OM.' },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'instalovanyVykonKwp',
          label: 'Instalovaný výkon [kWp]',
          type: 'number',
          min: 0,
          admin: { width: '25%', step: 0.01 },
        },
        {
          name: 'rezervovanyVykonKw',
          label: 'Rezervovaný výkon [kW]',
          type: 'number',
          min: 0,
          admin: { width: '25%', step: 0.01 },
        },
        {
          name: 'vykonStridacuKw',
          label: 'Výkon střídačů [kW]',
          type: 'number',
          min: 0,
          admin: { width: '25%', step: 0.01 },
        },
        {
          name: 'akumulaceKwh',
          label: 'Akumulace [kWh]',
          type: 'number',
          min: 0,
          admin: { width: '25%', step: 0.1 },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'odhadVyrobyMwh',
          label: 'Odhad roční výroby [MWh]',
          type: 'number',
          min: 0,
          admin: { width: '25%', step: 0.001 },
        },
        { name: 'licenceEru', label: 'Číslo licence ERÚ', type: 'text', admin: { width: '25%' } },
        {
          name: 'rezimPretoku',
          label: 'Režim',
          type: 'select',
          enumName: 'vyr_rezim',
          options: rezimPretokuOptions,
          admin: { width: '25%' },
        },
        {
          name: 'vykupPretoku',
          label: 'Přetoky vykupuje',
          type: 'select',
          enumName: 'vyr_vykup',
          options: vykupPretokuOptions,
          admin: { width: '25%' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'typMereni',
          label: 'Typ měření výroby',
          type: 'select',
          enumName: 'vyr_typ_mereni',
          options: typyMereni.EE,
          admin: { width: '25%' },
        },
        {
          name: 'edcAkumulace',
          label: 'Registrováno v EDC – akumulace',
          type: 'checkbox',
          defaultValue: false,
          admin: { width: '25%' },
        },
        {
          name: 'edcFlexibilita',
          label: 'Registrováno v EDC – flexibilita',
          type: 'checkbox',
          defaultValue: false,
          admin: { width: '25%' },
        },
      ],
    },
    {
      name: 'zadostOPripojeni',
      label: 'Žádost o připojení výrobny (PDS)',
      type: 'group',
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'cislo', label: 'Číslo žádosti', type: 'text', admin: { width: '25%' } },
            { name: 'druh', label: 'Druh žádosti', type: 'text', admin: { width: '35%' } },
            { name: 'datum', label: 'Podána', type: 'date', admin: { width: '20%', ...datumDen } },
            { name: 'stav', label: 'Stav', type: 'text', admin: { width: '20%' } },
          ],
        },
      ],
    },
    {
      name: 'vykupujici',
      label: 'Vykupující obchodník',
      type: 'text',
      admin: { condition: (_, s) => s?.vykupPretoku === 'jiny' },
    },
    {
      name: 'vykupniCena',
      label: 'Výkupní cena přetoků [Kč/MWh]',
      type: 'number',
      min: 0,
      // Obchodní údaj – stejná práva jako ceny u OM.
      access: { read: poleObchodniUdaje, create: poleObchodniUdaje, update: poleObchodniUdaje },
      admin: { step: 0.01, condition: (_, s) => s?.vykupPretoku === 'bse' },
    },
    {
      name: 'dokumenty',
      label: 'Dokumenty (smlouva o výkupu, revize, licence…)',
      type: 'upload',
      relationTo: 'dokumenty',
      hasMany: true,
    },
    { name: 'poznamka', label: 'Poznámka', type: 'textarea' },
  ],
}
