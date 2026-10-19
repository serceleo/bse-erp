/**
 * Číselné řady interních čísel OM – samostatná řada pro elektřinu a pro plyn.
 *
 * Používáme sekvence PostgreSQL: přidělení je atomické i při souběžném zakládání OM
 * více uživateli (žádné duplicity, žádné zámky v aplikaci). Sekvence se nevrací
 * s transakcí, takže při neúspěšném uložení může v řadě vzniknout mezera – to je
 * u interních čísel přijatelné a obvyklé.
 */
import { sql, type PostgresAdapter } from '@payloadcms/db-postgres'
import type { Payload } from 'payload'

import type { Komodita } from '../ciselniky'

type CiselnaRada = { prefix: string; sekvence: string; delka: number }

/** Formát: EE-00001, ZP-00001. Při změně formátu upravit i `synchronizujCiselneRady`. */
export const CISELNE_RADY: Record<Komodita, CiselnaRada> = {
  EE: { prefix: 'EE-', sekvence: 'om_cislo_ee_seq', delka: 5 },
  ZP: { prefix: 'ZP-', sekvence: 'om_cislo_zp_seq', delka: 5 },
}

const TABULKA_OM = 'odberna_mista'

const drizzle = (payload: Payload) => (payload.db as unknown as PostgresAdapter).drizzle

export const formatujInterniCislo = (komodita: Komodita, poradi: number): string => {
  const rada = CISELNE_RADY[komodita]
  return `${rada.prefix}${String(poradi).padStart(rada.delka, '0')}`
}

export const pridelInterniCislo = async (payload: Payload, komodita: Komodita): Promise<string> => {
  const { sekvence } = CISELNE_RADY[komodita]
  const vysledek = await drizzle(payload).execute(sql`SELECT nextval(${sekvence}::regclass) AS n`)
  return formatujInterniCislo(komodita, Number(vysledek.rows[0].n))
}

/**
 * Vytvoří sekvence (pokud chybí) a srovná je s nejvyšším existujícím číslem v tabulce.
 * Volá se při startu aplikace – díky tomu číslování funguje i po importu dat
 * nebo obnově databáze ze zálohy. Operace je idempotentní.
 */
export const synchronizujCiselneRady = async (payload: Payload): Promise<void> => {
  const db = drizzle(payload)
  const tabulkaExistuje = await db.execute(sql`SELECT to_regclass(${TABULKA_OM}) IS NOT NULL AS ok`)

  for (const { prefix, sekvence } of Object.values(CISELNE_RADY)) {
    // Názvy sekvencí jsou konstanty v kódu, ne vstup uživatele → sql.raw je zde bezpečné.
    await db.execute(sql.raw(`CREATE SEQUENCE IF NOT EXISTS ${sekvence} START WITH 1 MINVALUE 1`))

    if (!tabulkaExistuje.rows[0].ok) continue

    const max = await db.execute(sql`
      SELECT COALESCE(MAX(SUBSTRING(interni_cislo FROM ${prefix.length + 1})::int), 0) AS n
      FROM ${sql.identifier(TABULKA_OM)}
      WHERE interni_cislo ~ ${`^${prefix}[0-9]+$`}
    `)
    const nejvyssi = Number(max.rows[0].n)
    if (nejvyssi > 0) {
      // Sekvenci jen posouváme dopředu, nikdy zpět (GREATEST s aktuální hodnotou).
      await db.execute(sql`
        SELECT setval(${sekvence}::regclass, GREATEST(${nejvyssi}, (SELECT last_value FROM ${sql.identifier(sekvence)})))
      `)
    }
  }
}
