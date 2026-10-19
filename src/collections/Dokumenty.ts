import path from 'path'
import type { CollectionConfig } from 'payload'
import { fileURLToPath } from 'url'

import { prihlasen, smiEditovatEvidenci, jenAdmin } from '../shared/access/role'
import { auditFields, auditHook } from '../shared/fields/audit'
import { typDokumentuOptions } from '../modules/energie/ciselniky'

const dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * Úložiště souborů (smlouvy, plné moci, dodatky…), sdílené napříč ERP.
 *
 * Soubory jsou důvěrné: Payload je vydává přes /api/dokumenty/file/… a při tom
 * kontroluje přístup `read` – nepřihlášený uživatel se k nim nedostane.
 * Pro produkci doporučeno přepnout na S3-kompatibilní úložiště (plugin @payloadcms/storage-s3).
 */
export const Dokumenty: CollectionConfig = {
  slug: 'dokumenty',
  labels: { singular: 'Dokument', plural: 'Dokumenty' },
  admin: {
    useAsTitle: 'nazev',
    defaultColumns: ['nazev', 'typ', 'filename', 'updatedAt'],
    group: 'Energie',
  },
  access: {
    read: prihlasen,
    create: smiEditovatEvidenci,
    update: smiEditovatEvidenci,
    delete: jenAdmin,
  },
  upload: {
    staticDir: process.env.UPLOADS_DIR || path.resolve(dirname, '../../uploads/dokumenty'),
    mimeTypes: [
      'application/pdf',
      'image/*',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'application/vnd.oasis.opendocument.text',
      'application/vnd.oasis.opendocument.spreadsheet',
    ],
  },
  hooks: {
    beforeChange: [auditHook],
  },
  fields: [
    { name: 'nazev', label: 'Název dokumentu', type: 'text', required: true },
    {
      name: 'typ',
      label: 'Typ dokumentu',
      type: 'select',
      required: true,
      options: typDokumentuOptions,
    },
    { name: 'poznamka', label: 'Poznámka', type: 'textarea' },
    ...auditFields,
  ],
}
