import type { CollectionBeforeChangeHook, Field } from 'payload'

/**
 * Kdo záznam založil a kdo ho naposledy změnil.
 * Časy vytvoření/změny eviduje Payload sám (createdAt/updatedAt), historii obsahu verze.
 */
export const auditFields: Field[] = [
  {
    name: 'zalozil',
    label: 'Založil',
    type: 'relationship',
    relationTo: 'users',
    admin: { position: 'sidebar', readOnly: true },
  },
  {
    name: 'upravil',
    label: 'Naposledy upravil',
    type: 'relationship',
    relationTo: 'users',
    admin: { position: 'sidebar', readOnly: true },
  },
]

export const auditHook: CollectionBeforeChangeHook = ({ data, operation, originalDoc, req }) => {
  const userId = req.user?.collection === 'users' ? req.user.id : undefined
  const puvodni = (v: unknown) =>
    (v && typeof v === 'object' ? (v as { id: unknown }).id : v) ?? null

  // Hodnoty od klienta ignorujeme – auditní stopu nelze podvrhnout přes API.
  data.zalozil = operation === 'create' ? (userId ?? null) : puvodni(originalDoc?.zalozil)
  data.upravil = userId ?? (operation === 'create' ? null : puvodni(originalDoc?.upravil))
  return data
}
