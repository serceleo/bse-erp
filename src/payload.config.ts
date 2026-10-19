import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { cs } from '@payloadcms/translations/languages/cs'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { Dokumenty } from './collections/Dokumenty'
import { migrations } from './migrations'
import { Users } from './collections/Users'
import { energieModul } from './modules/energie'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  serverURL: process.env.SERVER_URL || '',
  admin: {
    user: Users.slug,
    meta: { titleSuffix: ' – BSE ERP' },
    dateFormat: 'd. M. yyyy HH:mm',
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  i18n: {
    supportedLanguages: { cs },
    fallbackLanguage: 'cs',
    translations: {
      cs: {
        // Prázdná buňka v tabulkách má zůstat prázdná (výchozí text je „<Žádný …>“).
        // Mezera, ne '' – prázdný překlad by Payload nahradil názvem klíče.
        general: { noLabel: ' ' },
      },
    },
  },
  collections: [...energieModul.collections, Dokumenty, Users],
  editor: lexicalEditor(),
  // Payload při startu sám odmítne běžet bez tajného klíče.
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
    // Ve vývoji se schéma synchronizuje automaticky; v produkci výhradně přes migrace.
    push: process.env.NODE_ENV !== 'production',
    migrationDir: path.resolve(dirname, 'migrations'),
    // V produkci se čekající migrace spustí automaticky při startu aplikace.
    prodMigrations: migrations,
  }),
  // GraphQL zatím nepotřebujeme – menší útočná plocha. REST API zůstává.
  graphQL: { disable: true },
  sharp,
  onInit: async (payload) => {
    await energieModul.onInit(payload)
  },
})
