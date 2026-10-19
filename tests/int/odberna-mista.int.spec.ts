/**
 * Integrační testy modulu Energie proti skutečnému PostgreSQL.
 * Testovací databáze se na začátku celá vymaže → TEST_DATABASE_URL musí obsahovat „test“.
 */
import pg from 'pg'
import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import type { User } from '@/payload-types'
import { kontrolniCisliceEAN, kontrolniZnakEIC } from '@/shared/validators/identifikatory'

let payload: Payload
let admin: User, obchodnik: User, operativa: User, ctenar: User
let zakaznikId: number

const ean = (poradi: number) => {
  const zaklad = `85918240000${String(poradi).padStart(6, '0')}`
  return zaklad + kontrolniCisliceEAN(zaklad)
}
const eic = (poradi: number) => {
  const zaklad = `27ZG7000000${String(poradi).padStart(4, '0')}`
  return zaklad + kontrolniZnakEIC(zaklad)
}

const zakladOM = (overrides: Record<string, unknown> = {}) => ({
  komodita: 'EE' as const,
  typOdberu: 'NN' as const,
  obchodniModel: 'zakaznik' as const,
  typZakaznika: 'bezny' as const,
  spotrebitel: 'ne' as const,
  stav: 'aktivni' as const,
  zakaznik: zakaznikId,
  kod: ean(1),
  adresa: { ulice: 'Hlavní', cisloPopisne: '375', obec: 'Zubří', psc: '75654' },
  ...overrides,
})

const vytvorOM = (data: Record<string, unknown>, user: User = admin) =>
  payload.create({ collection: 'odberna-mista', data: data as never, user, overrideAccess: false })

beforeAll(async () => {
  const url = process.env.DATABASE_URL ?? ''
  if (!/test/.test(url))
    throw new Error(
      'Testy smí běžet jen proti testovací databázi (TEST_DATABASE_URL obsahující „test“).',
    )

  const klient = new pg.Client({ connectionString: url })
  await klient.connect()
  await klient.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;')
  await klient.end()

  const { default: config } = await import('@/payload.config')
  payload = await getPayload({ config: await config })

  const uzivatel = (email: string, roles: User['roles']) =>
    payload.create({
      collection: 'users',
      data: { email, password: 'Test-heslo-123', jmeno: email, roles },
      overrideAccess: true,
    }) as Promise<User>

  admin = await uzivatel('admin@test.cz', ['admin'])
  obchodnik = await uzivatel('obchod@test.cz', ['obchod'])
  operativa = await uzivatel('operativa@test.cz', ['operativa'])
  ctenar = await uzivatel('cteni@test.cz', ['cteni'])

  const zakaznik = await payload.create({
    collection: 'zakaznici',
    data: { nazev: 'Testovací s.r.o.', typSubjektu: 'po', ico: '45274649' },
    user: admin,
    overrideAccess: false,
  })
  zakaznikId = zakaznik.id
})

afterAll(async () => {
  await payload?.destroy()
})

describe('Číslování a odvozené hodnoty', () => {
  it('přidělí čísla ze samostatných řad EE a ZP', async () => {
    const ee1 = await vytvorOM(zakladOM({ kod: ean(1) }))
    const zp1 = await vytvorOM(zakladOM({ komodita: 'ZP', typOdberu: 'MO', kod: eic(1) }))
    const ee2 = await vytvorOM(zakladOM({ kod: ean(2) }))

    expect(ee1.interniCislo).toBe('EE-00001')
    expect(zp1.interniCislo).toBe('ZP-00001')
    expect(ee2.interniCislo).toBe('EE-00002')
  })

  it('ignoruje interní číslo poslané klientem a nedovolí ho ani komoditu změnit', async () => {
    const om = await vytvorOM(zakladOM({ kod: ean(3), interniCislo: 'PODVRH-1' }))
    expect(om.interniCislo).toMatch(/^EE-\d{5}$/)

    const upraveny = await payload.update({
      collection: 'odberna-mista',
      id: om.id,
      data: { interniCislo: 'ZP-99999', komodita: 'ZP' } as never,
      user: admin,
      overrideAccess: false,
    })
    expect(upraveny.interniCislo).toBe(om.interniCislo)
    expect(upraveny.komodita).toBe('EE')
  })

  it('normalizuje kód a skládá adresu i označení', async () => {
    const kod = ean(4)
    const om = await vytvorOM(zakladOM({ kod: `${kod.slice(0, 9)} ${kod.slice(9)}` }))
    expect(om.kod).toBe(kod)
    expect(om.adresaText).toBe('Hlavní 375, Zubří, 756 54')
    expect(om.oznaceni).toBe(`${om.interniCislo} – Hlavní 375, Zubří, 756 54`)
    expect(om.zalozil).toBeTruthy()
  })

  it('sečte měsíční odhad do roční spotřeby', async () => {
    const om = await vytvorOM(
      zakladOM({
        kod: ean(5),
        typOdberu: 'VN',
        odhadSpotreby: { rezim: 'mesicni', mesicni: { leden: 10.5, unor: 9.5, prosinec: 12 } },
      }),
    )
    expect(om.odhadSpotreby?.rocniMwh).toBe(32)
  })
})

describe('Validace', () => {
  it('odmítne typ odběru, který nepatří ke komoditě', async () => {
    await expect(vytvorOM(zakladOM({ kod: ean(10), typOdberu: 'SO' }))).rejects.toThrow(
      /Typ odběru/,
    )
  })

  it('odmítne EAN s chybnou kontrolní číslicí', async () => {
    const spatny = ean(11).slice(0, 17) + ((Number(ean(11)[17]) + 1) % 10)
    await expect(vytvorOM(zakladOM({ kod: spatny }))).rejects.toThrow(/Kód OM/)
  })

  it('odmítne EAN u plynu (vyžaduje EIC)', async () => {
    await expect(
      vytvorOM(zakladOM({ komodita: 'ZP', typOdberu: 'MO', kod: ean(12) })),
    ).rejects.toThrow(/Kód OM/)
  })

  it('odmítne duplicitní kód OM', async () => {
    await expect(vytvorOM(zakladOM({ kod: ean(1) }))).rejects.toThrow()
  })

  it('odmítne překrývající se nakoupená období', async () => {
    await expect(
      vytvorOM(
        zakladOM({
          kod: ean(13),
          obchod: {
            cenovaObdobi: [
              { od: '2026-01-01', do: '2026-12-31', typCeny: 'fixni' },
              { od: '2026-06-01', do: '2027-05-31', typCeny: 'fixni' },
            ],
          },
        }),
      ),
    ).rejects.toThrow(/Nakoupená období/)
  })

  it('smlouvou o dodávce může být jen smlouva typu „dodávka“', async () => {
    const najem = await payload.create({
      collection: 'smlouvy',
      data: { cislo: 'N-1', typ: 'najemni', stav: 'platna' },
      user: admin,
      overrideAccess: false,
    })
    await expect(vytvorOM(zakladOM({ kod: ean(14), smlouvaODodavce: najem.id }))).rejects.toThrow()
  })
})

describe('Varianty dle typu odběru', () => {
  it('po změně VN → NN smaže parametry VN', async () => {
    const om = await vytvorOM(
      zakladOM({
        kod: ean(20),
        typOdberu: 'VN',
        parametryVN: { napetovaHladina: '22', rezervovanaKapacitaKw: 400 },
      }),
    )
    expect(om.parametryVN?.rezervovanaKapacitaKw).toBe(400)

    const nn = await payload.update({
      collection: 'odberna-mista',
      id: om.id,
      data: { typOdberu: 'NN' },
      user: admin,
      overrideAccess: false,
    })
    expect(nn.parametryVN?.rezervovanaKapacitaKw ?? null).toBeNull()
  })
})

describe('Obchodní údaje a oprávnění', () => {
  let omId: number

  it('obchod uloží ceny, marže a „nakoupeno do“ se dopočítají', async () => {
    const om = await vytvorOM(
      zakladOM({
        kod: ean(30),
        obchod: {
          cenovaObdobi: [
            {
              od: '2026-01-01',
              do: '2026-12-31',
              typCeny: 'fixni',
              nakupniCena: 2450.5,
              prodejniCena: 2890,
              marze: 999999,
            },
            {
              od: '2027-01-01',
              do: '2027-12-31',
              typCeny: 'fixni',
              nakupniCena: 2300,
              prodejniCena: 2700,
            },
          ],
          dodatek: { stav: 'pripravit' },
        },
      }),
      obchodnik,
    )
    omId = om.id
    expect(om.obchod?.cenovaObdobi?.[0].marze).toBe(439.5)
    expect(om.obchod?.cenovaObdobi?.[1].marze).toBe(400)
    expect(om.nakoupenoDo?.slice(0, 10)).toBe('2027-12-31')
  })

  it('čtenář ceny nevidí', async () => {
    const om = await payload.findByID({
      collection: 'odberna-mista',
      id: omId,
      user: ctenar,
      overrideAccess: false,
    })
    expect(om.obchod).toBeUndefined()
    expect(om.kod).toBeTruthy()
  })

  it('operativa ceny nevidí ani nezmění (ani nepřímo přes „nakoupeno do“)', async () => {
    const om = await payload.update({
      collection: 'odberna-mista',
      id: omId,
      data: {
        poznamka: 'upraveno operativou',
        obchod: {
          cenovaObdobi: [{ od: '2026-01-01', do: '2030-12-31', typCeny: 'fixni', prodejniCena: 1 }],
        },
      } as never,
      user: operativa,
      overrideAccess: false,
    })
    expect(om.poznamka).toBe('upraveno operativou')
    expect(om.obchod).toBeUndefined()

    const proObchod = await payload.findByID({
      collection: 'odberna-mista',
      id: omId,
      user: obchodnik,
      overrideAccess: false,
    })
    expect(proObchod.obchod?.cenovaObdobi).toHaveLength(2)
    expect(proObchod.nakoupenoDo?.slice(0, 10)).toBe('2027-12-31')
  })

  it('čtenář nesmí OM upravovat ani zakládat', async () => {
    await expect(
      payload.update({
        collection: 'odberna-mista',
        id: omId,
        data: { poznamka: 'x' },
        user: ctenar,
        overrideAccess: false,
      }),
    ).rejects.toThrow()
    await expect(vytvorOM(zakladOM({ kod: ean(31) }), ctenar)).rejects.toThrow()
  })

  it('uživatel si nemůže sám přidělit roli', async () => {
    const ja = await payload.update({
      collection: 'users',
      id: ctenar.id,
      data: { roles: ['admin'] },
      user: ctenar,
      overrideAccess: false,
    })
    expect(ja.roles).toEqual(['cteni'])
  })
})

describe('Vazby', () => {
  it('v detailu zákazníka jsou vidět jeho OM', async () => {
    const z = await payload.findByID({
      collection: 'zakaznici',
      id: zakaznikId,
      user: admin,
      overrideAccess: false,
    })
    expect(z.odbernaMista?.docs?.length).toBeGreaterThan(5)
  })
})
