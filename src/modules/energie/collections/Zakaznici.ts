import type { CollectionConfig } from 'payload'

import { jenAdmin, prihlasen, smiEditovatEvidenci } from '../../../shared/access/role'
import { adresaField } from '../../../shared/fields/adresa'
import { auditFields, auditHook } from '../../../shared/fields/audit'
import { jePlatneICO } from '../../../shared/validators/identifikatory'

/**
 * Zákazníci = smluvní partneři. Jeden zákazník může mít libovolný počet OM
 * (elektřina i plyn) – přehled je vidět přímo v detailu zákazníka.
 */
export const Zakaznici: CollectionConfig = {
  slug: 'zakaznici',
  labels: { singular: 'Zákazník', plural: 'Zákazníci' },
  admin: {
    useAsTitle: 'nazev',
    defaultColumns: ['nazev', 'typSubjektu', 'ico', 'kontakt.email', 'updatedAt'],
    listSearchableFields: ['nazev', 'ico', 'dic'],
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
    beforeChange: [auditHook],
    afterChange: [
      // Při změně názvu či IČO přepočítáme vyhledávací text u OM tohoto zákazníka.
      async ({ doc, previousDoc, operation, req }) => {
        if (operation !== 'update') return doc
        if (doc.nazev === previousDoc?.nazev && doc.ico === previousDoc?.ico) return doc
        const text = [doc.nazev, doc.ico ? `(IČO ${doc.ico})` : ''].filter(Boolean).join(' ')
        const om = await req.payload.find({
          collection: 'odberna-mista',
          where: { zakaznik: { equals: doc.id } },
          depth: 0,
          limit: 0,
          pagination: false,
          overrideAccess: true,
          req,
        })
        for (const o of om.docs) {
          if (o.zakaznikText !== text) {
            await req.payload.update({
              collection: 'odberna-mista',
              id: o.id,
              data: {},
              depth: 0,
              overrideAccess: true,
              req,
            })
          }
        }
        return doc
      },
    ],
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Základní údaje',
          fields: [
            {
              name: 'nazev',
              label: 'Obchodní firma / jméno a příjmení',
              type: 'text',
              required: true,
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'typSubjektu',
                  label: 'Typ subjektu',
                  type: 'select',
                  required: true,
                  defaultValue: 'po',
                  options: [
                    { label: 'Právnická osoba', value: 'po' },
                    { label: 'Podnikající fyzická osoba', value: 'fop' },
                    { label: 'Fyzická osoba (nepodnikající)', value: 'fo' },
                  ],
                  admin: { width: '40%' },
                },
                {
                  name: 'ico',
                  label: 'IČO',
                  type: 'text',
                  unique: true,
                  index: true,
                  admin: { width: '30%', condition: (_, s) => s?.typSubjektu !== 'fo' },
                  validate: (
                    value: string | null | undefined,
                    { siblingData }: { siblingData: Record<string, unknown> },
                  ) => {
                    if (!value)
                      return siblingData?.typSubjektu === 'fo' || 'IČO je u podnikatelů povinné.'
                    return jePlatneICO(value) || 'Neplatné IČO (nesedí kontrolní číslice).'
                  },
                },
                {
                  name: 'dic',
                  label: 'DIČ',
                  type: 'text',
                  admin: { width: '30%', condition: (_, s) => s?.typSubjektu !== 'fo' },
                  validate: (value: string | null | undefined) =>
                    !value ||
                    /^[A-Z]{2}\d{8,10}$/.test(value.replace(/\s+/g, '').toUpperCase()) ||
                    'DIČ ve tvaru CZ12345678.',
                },
              ],
            },
            adresaField({ name: 'sidlo', label: 'Sídlo / bydliště' }),
            {
              name: 'kontakt',
              label: 'Kontaktní osoba',
              type: 'group',
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'jmeno', label: 'Jméno', type: 'text', admin: { width: '40%' } },
                    { name: 'email', label: 'E-mail', type: 'email', admin: { width: '35%' } },
                    { name: 'telefon', label: 'Telefon', type: 'text', admin: { width: '25%' } },
                  ],
                },
              ],
            },
            { name: 'poznamka', label: 'Poznámka', type: 'textarea' },
          ],
        },
        {
          label: 'Odběrná místa a smlouvy',
          fields: [
            {
              name: 'odbernaMista',
              label: 'Odběrná místa zákazníka',
              type: 'join',
              collection: 'odberna-mista',
              on: 'zakaznik',
              defaultLimit: 50,
              admin: {
                defaultColumns: ['interniCislo', 'komodita', 'kod', 'adresaText', 'stav'],
              },
            },
            {
              name: 'smlouvy',
              label: 'Smlouvy zákazníka',
              type: 'join',
              collection: 'smlouvy',
              on: 'zakaznik',
              defaultLimit: 50,
              admin: { defaultColumns: ['cislo', 'typ', 'stav', 'platnostOd', 'platnostDo'] },
            },
          ],
        },
      ],
    },
    ...auditFields,
  ],
}
