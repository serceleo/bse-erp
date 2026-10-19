import type { CollectionConfig } from 'payload'

import { jenAdmin, prihlasen, smiEditovatEvidenci } from '../../../shared/access/role'
import { auditFields, auditHook } from '../../../shared/fields/audit'
import { komodityOptions, labelPro, stavSmlouvyOptions, typSmlouvyOptions } from '../ciselniky'

const datumDen = { date: { pickerAppearance: 'dayOnly', displayFormat: 'd. M. yyyy' } } as const

/**
 * Evidence smluv. Jedna smlouva se může vázat k více OM (např. rámcová dodávka
 * pro celý areál) – vazby se zakládají v detailu OM a zde jsou vidět zpětně.
 */
export const Smlouvy: CollectionConfig = {
  slug: 'smlouvy',
  labels: { singular: 'Smlouva', plural: 'Smlouvy' },
  admin: {
    useAsTitle: 'oznaceni',
    defaultColumns: ['cislo', 'typ', 'zakaznik', 'protistrana', 'stav', 'platnostOd', 'platnostDo'],
    listSearchableFields: ['cislo', 'protistrana', 'oznaceni'],
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
    beforeChange: [
      auditHook,
      ({ data, originalDoc }) => {
        const typ = data.typ ?? originalDoc?.typ
        const cislo = data.cislo ?? originalDoc?.cislo
        data.oznaceni = `${labelPro(typSmlouvyOptions, typ)} č. ${cislo}`
        return data
      },
    ],
  },
  fields: [
    {
      name: 'oznaceni',
      type: 'text',
      admin: { hidden: true },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'cislo',
          label: 'Číslo smlouvy',
          type: 'text',
          required: true,
          index: true,
          admin: { width: '35%' },
        },
        {
          name: 'typ',
          label: 'Typ smlouvy',
          type: 'select',
          required: true,
          options: typSmlouvyOptions,
          admin: { width: '40%' },
        },
        {
          name: 'komodita',
          label: 'Komodita',
          type: 'select',
          options: komodityOptions,
          admin: { width: '25%' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'zakaznik',
          label: 'Zákazník (z adresáře)',
          type: 'relationship',
          relationTo: 'zakaznici',
          index: true,
          admin: { width: '50%' },
        },
        {
          name: 'protistrana',
          label: 'Jiná smluvní strana',
          type: 'text',
          admin: {
            width: '50%',
            description: 'Např. distributor, dodavatel silové elektřiny, pronajímatel.',
          },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'datumUzavreni',
          label: 'Uzavřena dne',
          type: 'date',
          admin: { width: '25%', ...datumDen },
        },
        {
          name: 'platnostOd',
          label: 'Účinnost od',
          type: 'date',
          admin: { width: '25%', ...datumDen },
        },
        {
          name: 'platnostDo',
          label: 'Účinnost do',
          type: 'date',
          admin: { width: '25%', description: 'Prázdné = doba neurčitá.', ...datumDen },
          validate: (
            value: unknown,
            { siblingData }: { siblingData: Partial<Record<string, unknown>> },
          ) =>
            !value ||
            !siblingData?.platnostOd ||
            new Date(value as string) >= new Date(siblingData.platnostOd as string) ||
            'Konec účinnosti nesmí předcházet začátku.',
        },
        { name: 'vypovedniLhuta', label: 'Výpovědní lhůta', type: 'text', admin: { width: '25%' } },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'stav',
          label: 'Stav',
          type: 'select',
          required: true,
          defaultValue: 'platna',
          options: stavSmlouvyOptions,
          admin: { width: '35%' },
        },
        {
          name: 'soubor',
          label: 'Soubor smlouvy',
          type: 'upload',
          relationTo: 'dokumenty',
          admin: { width: '65%' },
        },
      ],
    },
    {
      name: 'dodatky',
      label: 'Dodatky',
      labels: { singular: 'Dodatek', plural: 'Dodatky' },
      type: 'array',
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'cislo',
              label: 'Číslo dodatku',
              type: 'text',
              required: true,
              admin: { width: '20%' },
            },
            {
              name: 'datum',
              label: 'Uzavřen dne',
              type: 'date',
              admin: { width: '20%', ...datumDen },
            },
            { name: 'predmet', label: 'Předmět', type: 'text', admin: { width: '30%' } },
            {
              name: 'soubor',
              label: 'Soubor',
              type: 'upload',
              relationTo: 'dokumenty',
              admin: { width: '30%' },
            },
          ],
        },
      ],
    },
    { name: 'poznamka', label: 'Poznámka', type: 'textarea' },
    {
      name: 'omDodavka',
      label: 'OM, kde je smlouvou o dodávce',
      type: 'join',
      collection: 'odberna-mista',
      on: 'smlouvaODodavce',
      admin: { defaultColumns: ['interniCislo', 'komodita', 'kod', 'adresaText', 'stav'] },
    },
    {
      name: 'omSouvisejici',
      label: 'OM, kde je vedena jako související',
      type: 'join',
      collection: 'odberna-mista',
      on: 'souvisejiciSmlouvy',
      admin: { defaultColumns: ['interniCislo', 'komodita', 'kod', 'adresaText', 'stav'] },
    },
    ...auditFields,
  ],
}
