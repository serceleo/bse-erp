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
    expect(om.typ).toBe('Z')
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

  it('sloučený typ: Z / V a přípona -S u spotřebitele', async () => {
    const om = await vytvorOM(
      zakladOM({ kod: ean(6), typZakaznika: 'virtualni', spotrebitel: 'ano' }),
    )
    expect(om.typ).toBe('V-S')
    const zmena = await payload.update({
      collection: 'odberna-mista',
      id: om.id,
      data: { typZakaznika: 'bezny' },
      user: admin,
      overrideAccess: false,
    })
    expect(zmena.typ).toBe('Z-S')
  })
})

describe('Plyn: typ odběru podle roční spotřeby', () => {
  it('MO do 630 MWh včetně, SO do 4 200 MWh včetně, VO nad', async () => {
    const pripady: [number, string][] = [
      [18, 'MO'],
      [630, 'MO'],
      [630.001, 'SO'],
      [4200, 'SO'],
      [4200.5, 'VO'],
    ]
    for (const [i, [mwh, ocekavany]] of pripady.entries()) {
      const om = await vytvorOM(
        zakladOM({
          komodita: 'ZP',
          typOdberu: undefined,
          kod: eic(100 + i),
          odhadSpotreby: { rezim: 'rocni', rocniMwh: mwh },
        }),
      )
      expect(om.typOdberu, `${mwh} MWh`).toBe(ocekavany)
    }
  })

  it('přebije ručně zvolený typ a počítá i z měsíčního odhadu', async () => {
    const om = await vytvorOM(
      zakladOM({
        komodita: 'ZP',
        typOdberu: 'VO',
        kod: eic(112),
        odhadSpotreby: { rezim: 'mesicni', mesicni: { leden: 400, unor: 300 } },
      }),
    )
    expect(om.typOdberu).toBe('SO')
    const mensi = await payload.update({
      collection: 'odberna-mista',
      id: om.id,
      data: { odhadSpotreby: { rezim: 'rocni', rocniMwh: 100 } },
      user: admin,
      overrideAccess: false,
    })
    expect(mensi.typOdberu).toBe('MO')
  })

  it('ruční určení kategorie spotřeba nepřepíše', async () => {
    const om = await vytvorOM(
      zakladOM({
        komodita: 'ZP',
        typOdberu: 'MO',
        typOdberuRucne: true,
        kod: eic(113),
        odhadSpotreby: { rezim: 'rocni', rocniMwh: 662.3 },
      }),
    )
    expect(om.typOdberu).toBe('MO')
    const auto = await payload.update({
      collection: 'odberna-mista',
      id: om.id,
      data: { typOdberuRucne: false },
      user: admin,
      overrideAccess: false,
    })
    expect(auto.typOdberu).toBe('SO')
  })

  it('bez odhadu spotřeby je typ odběru povinný', async () => {
    await expect(
      vytvorOM(zakladOM({ komodita: 'ZP', typOdberu: undefined, kod: eic(111) })),
    ).rejects.toThrow(/Typ odběru/)
  })
})

describe('Odhad spotřeby a chybějící zákazník', () => {
  it('neúplný měsíční profil zachová ručně zadaný roční odhad', async () => {
    const om = await vytvorOM(
      zakladOM({
        kod: ean(40),
        odhadSpotreby: { rezim: 'mesicni', rocniMwh: 300, mesicni: { listopad: 28, prosinec: 21 } },
      }),
    )
    expect(om.odhadSpotreby?.rocniMwh).toBe(300)
  })

  it('úplný měsíční profil přepíše roční odhad součtem', async () => {
    const mesicni = Object.fromEntries(
      [
        'leden',
        'unor',
        'brezen',
        'duben',
        'kveten',
        'cerven',
        'cervenec',
        'srpen',
        'zari',
        'rijen',
        'listopad',
        'prosinec',
      ].map((m) => [m, 10]),
    )
    const om = await vytvorOM(
      zakladOM({ kod: ean(41), odhadSpotreby: { rezim: 'mesicni', rocniMwh: 999, mesicni } }),
    )
    expect(om.odhadSpotreby?.rocniMwh).toBe(120)
  })

  it('OM lze založit bez zákazníka a upozorní na to', async () => {
    const om = await vytvorOM(zakladOM({ kod: ean(42), zakaznik: undefined }))
    expect(om.zakaznik ?? null).toBeNull()
    expect(om.upozorneni).toMatch(/Chybí zákazník/)
  })
})

describe('Hledání podle zákazníka', () => {
  it('OM nese název a IČO zákazníka a po přejmenování zákazníka se aktualizuje', async () => {
    const z = await payload.create({
      collection: 'zakaznici',
      data: { nazev: 'Hledaná firma s.r.o.', typSubjektu: 'po', ico: '26463318' },
      user: admin,
      overrideAccess: false,
    })
    const om = await vytvorOM(zakladOM({ kod: ean(50), zakaznik: z.id }))
    expect(om.zakaznikText).toBe('Hledaná firma s.r.o. (IČO 26463318)')

    await payload.update({
      collection: 'zakaznici',
      id: z.id,
      data: { nazev: 'Přejmenovaná a.s.' },
      user: admin,
      overrideAccess: false,
    })
    const nalez = await payload.find({
      collection: 'odberna-mista',
      where: { zakaznikText: { like: 'přejmenovaná' } },
      user: admin,
      overrideAccess: false,
    })
    expect(nalez.docs.map((d) => d.id)).toContain(om.id)
  })
})

describe('Výrobny (FVE)', () => {
  it('výrobna se promítne do souhrnu OM a po smazání zmizí', async () => {
    const om = await vytvorOM(zakladOM({ kod: ean(60) }))
    expect(om.vyrobny ?? null).toBeNull()

    const v = await payload.create({
      collection: 'vyrobny',
      data: {
        odberneMisto: om.id,
        druh: 'fve',
        stav: 'provoz',
        ean: ean(61),
        instalovanyVykonKwp: 99,
      },
      user: admin,
      overrideAccess: false,
    })
    expect(v.oznaceni).toBe('FVE – Hlavní 375, Zubří')
    let omPo = await payload.findByID({
      collection: 'odberna-mista',
      id: om.id,
      user: admin,
      overrideAccess: false,
    })
    expect(omPo.vyrobny).toBe('FVE')
    expect(omPo.vyrobnyOM?.docs?.length).toBe(1)

    await payload.delete({ collection: 'vyrobny', id: v.id, user: admin, overrideAccess: false })
    omPo = await payload.findByID({
      collection: 'odberna-mista',
      id: om.id,
      user: admin,
      overrideAccess: false,
    })
    expect(omPo.vyrobny ?? null).toBeNull()
  })

  it('souhrn výroben nejde podvrhnout přes API OM', async () => {
    const om = await vytvorOM(zakladOM({ kod: ean(62), vyrobny: 'FVE' }))
    expect(om.vyrobny ?? null).toBeNull()
  })

  it('výkupní cenu nevidí role bez přístupu k cenám', async () => {
    const om = await vytvorOM(zakladOM({ kod: ean(63) }))
    const v = await payload.create({
      collection: 'vyrobny',
      data: {
        odberneMisto: om.id,
        druh: 'fve',
        stav: 'provoz',
        vykupPretoku: 'bse',
        vykupniCena: 1500,
      },
      user: admin,
      overrideAccess: false,
    })
    const proCtenare = await payload.findByID({
      collection: 'vyrobny',
      id: v.id,
      user: ctenar,
      overrideAccess: false,
    })
    expect(proCtenare.vykupniCena).toBeUndefined()
    const proObchod = await payload.findByID({
      collection: 'vyrobny',
      id: v.id,
      user: obchodnik,
      overrideAccess: false,
    })
    expect(proObchod.vykupniCena).toBe(1500)
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
        parametryVN: { napetovaHladina: '22', rezervovanyPrikonKw: 400 },
      }),
    )
    expect(om.parametryVN?.rezervovanyPrikonKw).toBe(400)

    const nn = await payload.update({
      collection: 'odberna-mista',
      id: om.id,
      data: { typOdberu: 'NN' },
      user: admin,
      overrideAccess: false,
    })
    expect(nn.parametryVN?.rezervovanyPrikonKw ?? null).toBeNull()
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
