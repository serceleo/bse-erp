import { APIError, type CollectionConfig, type FieldAccess } from 'payload'

import { jenAdmin, maRoli, poleJenAdmin, ROLE, roleOptions, type Role } from '../shared/access/role'

const zadnyUzivatelZatimNeexistuje = async (
  payload: Parameters<FieldAccess>[0]['req']['payload'],
) => (await payload.count({ collection: 'users', overrideAccess: true })).totalDocs === 0

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'Uživatel', plural: 'Uživatelé' },
  admin: {
    useAsTitle: 'jmeno',
    defaultColumns: ['jmeno', 'email', 'roles'],
    group: 'Systém',
  },
  auth: {
    tokenExpiration: 60 * 60 * 8, // pracovní den
    maxLoginAttempts: 5,
    lockTime: 15 * 60 * 1000,
  },
  access: {
    // Uživatel vidí jen sebe, admin všechny.
    read: ({ req }) =>
      maRoli(req.user, ROLE.admin) ? true : req.user ? { id: { equals: req.user.id } } : false,
    create: async ({ req }) =>
      maRoli(req.user, ROLE.admin) || (await zadnyUzivatelZatimNeexistuje(req.payload)),
    update: ({ req }) =>
      maRoli(req.user, ROLE.admin) ? true : req.user ? { id: { equals: req.user.id } } : false,
    delete: jenAdmin,
    admin: ({ req }) => Boolean(req.user),
  },
  hooks: {
    beforeChange: [
      async ({ data, operation, originalDoc, req }) => {
        // První uživatel v systému je vždy administrátor.
        if (operation === 'create' && (await zadnyUzivatelZatimNeexistuje(req.payload))) {
          data.roles = [ROLE.admin]
        }
        // Nelze odebrat roli admin poslednímu administrátorovi – systém by zůstal bez správce.
        const byl = (originalDoc?.roles as Role[] | undefined)?.includes(ROLE.admin)
        const bude = (data.roles as Role[] | undefined)?.includes(ROLE.admin)
        if (operation === 'update' && byl && data.roles && !bude) {
          const ostatniAdmini = await req.payload.count({
            collection: 'users',
            overrideAccess: true,
            where: {
              and: [{ roles: { contains: ROLE.admin } }, { id: { not_equals: originalDoc.id } }],
            },
          })
          if (ostatniAdmini.totalDocs === 0) {
            throw new APIError(
              'Nelze odebrat roli administrátora poslednímu administrátorovi.',
              400,
              null,
              true,
            )
          }
        }
        return data
      },
    ],
    beforeDelete: [
      async ({ id, req }) => {
        const admini = await req.payload.find({
          collection: 'users',
          overrideAccess: true,
          where: { roles: { contains: ROLE.admin } },
          limit: 2,
          depth: 0,
        })
        if (admini.totalDocs === 1 && admini.docs[0].id === id) {
          throw new APIError('Posledního administrátora nelze smazat.', 400, null, true)
        }
      },
    ],
  },
  fields: [
    { name: 'jmeno', label: 'Jméno a příjmení', type: 'text', required: true },
    {
      name: 'roles',
      label: 'Role',
      type: 'select',
      hasMany: true,
      required: true,
      defaultValue: [ROLE.cteni],
      options: roleOptions,
      saveToJWT: true,
      access: {
        // Role smí měnit jen admin – jinak by si je mohl kdokoli přidělit sám (eskalace práv).
        create: async ({ req }) =>
          maRoli(req.user, ROLE.admin) || (await zadnyUzivatelZatimNeexistuje(req.payload)),
        update: poleJenAdmin,
      },
      admin: {
        description: 'Uživatel může mít více rolí. Ceny a marže vidí jen Administrátor a Obchod.',
      },
    },
  ],
  timestamps: true,
}
