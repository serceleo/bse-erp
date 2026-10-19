import type { CollectionConfig } from 'payload'

import { jenAdmin, prihlasen, smiEditovatEvidenci } from '../../../shared/access/role'
import { auditFields, auditHook } from '../../../shared/fields/audit'

/**
 * Soubor OM = pojmenovaná množina odběrných míst (typicky areál, lokalita,
 * vlastník areálu). Slouží k filtrování, souhrnům spotřeby a fakturačním podkladům.
 */
export const SouboryOM: CollectionConfig = {
  slug: 'soubory-om',
  labels: { singular: 'Soubor OM', plural: 'Soubory OM' },
  admin: {
    useAsTitle: 'nazev',
    defaultColumns: ['nazev', 'lokalita', 'vlastnikArealu', 'updatedAt'],
    group: 'Energie',
  },
  access: {
    read: prihlasen,
    create: smiEditovatEvidenci,
    update: smiEditovatEvidenci,
    delete: jenAdmin,
  },
  hooks: {
    beforeChange: [auditHook],
  },
  fields: [
    { name: 'nazev', label: 'Název souboru', type: 'text', required: true, unique: true },
    {
      type: 'row',
      fields: [
        { name: 'lokalita', label: 'Lokalita', type: 'text', admin: { width: '50%' } },
        {
          name: 'vlastnikArealu',
          label: 'Vlastník areálu',
          type: 'relationship',
          relationTo: 'zakaznici',
          admin: {
            width: '50%',
            description: 'Pokud je vlastník areálu zároveň v adresáři zákazníků.',
          },
        },
      ],
    },
    { name: 'popis', label: 'Popis', type: 'textarea' },
    {
      name: 'odbernaMista',
      label: 'Odběrná místa v souboru',
      type: 'join',
      collection: 'odberna-mista',
      on: 'souborOM',
      defaultLimit: 100,
      admin: {
        defaultColumns: ['interniCislo', 'komodita', 'typOdberu', 'zakaznik', 'kod', 'adresaText'],
      },
    },
    ...auditFields,
  ],
}
