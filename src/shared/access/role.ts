/**
 * Role a přístupová práva.
 *
 * Princip: přístup se odvozuje od rolí uživatele (uložených v JWT), nikdy ne od dat
 * poslaných klientem. Uživatel může mít více rolí současně.
 */
import type { Access, FieldAccess, OptionObject, PayloadRequest } from 'payload'

export const ROLE = {
  admin: 'admin',
  /** Obchod – vidí a edituje i nákupní/prodejní ceny a marže. */
  obchod: 'obchod',
  /** Operativa / back-office – eviduje OM, smlouvy a dokumenty, ale nevidí ceny. */
  operativa: 'operativa',
  /** Jen čtení (bez cen). */
  cteni: 'cteni',
} as const
export type Role = (typeof ROLE)[keyof typeof ROLE]

export const roleOptions: OptionObject[] = [
  { label: 'Administrátor', value: ROLE.admin },
  { label: 'Obchod (vidí ceny a marže)', value: ROLE.obchod },
  { label: 'Operativa (bez cen)', value: ROLE.operativa },
  { label: 'Jen čtení', value: ROLE.cteni },
]

type UzivatelSRolemi = { roles?: Role[] | null } | null | undefined

export const maRoli = (user: UzivatelSRolemi, ...role: Role[]): boolean =>
  Boolean(user?.roles?.some((r) => role.includes(r)))

const userZ = (req: PayloadRequest) => req.user as UzivatelSRolemi

// ── Přístup na úrovni kolekcí ────────────────────────────────────────────────
export const prihlasen: Access = ({ req }) => Boolean(req.user)
export const jenAdmin: Access = ({ req }) => maRoli(userZ(req), ROLE.admin)
/** Kdo smí zakládat a upravovat evidenci (OM, zákazníky, smlouvy, dokumenty). */
export const smiEditovatEvidenci: Access = ({ req }) =>
  maRoli(userZ(req), ROLE.admin, ROLE.obchod, ROLE.operativa)

// ── Přístup na úrovni polí ───────────────────────────────────────────────────
export const poleJenAdmin: FieldAccess = ({ req }) => maRoli(userZ(req), ROLE.admin)
/** Obchodní a cenové údaje – vidí a mění jen obchod a admin. */
export const poleObchodniUdaje: FieldAccess = ({ req }) =>
  maRoli(userZ(req), ROLE.admin, ROLE.obchod)
