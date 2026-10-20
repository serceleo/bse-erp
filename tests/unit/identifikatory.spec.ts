import { describe, expect, it } from 'vitest'

import { adresaNaRadek } from '@/shared/fields/adresa'
import {
  jePlatneICO,
  jePlatnePSC,
  jePlatnyEAN18,
  jePlatnyEIC,
} from '@/shared/validators/identifikatory'
import { formatujInterniCislo } from '@/modules/energie/lib/ciselneRady'

describe('EIC', () => {
  it('přijme platné kódy (ověřeno na veřejných kódech ENTSO-E)', () => {
    for (const k of [
      '10YCZ-CEPS-----N',
      '10YDE-VE-------2',
      '10YAT-APG------L',
      '10Y1001A1001A82H',
    ]) {
      expect(jePlatnyEIC(k)).toBe(true)
    }
  })
  it('odmítne chybný kontrolní znak, délku i znaky', () => {
    expect(jePlatnyEIC('10YCZ-CEPS-----M')).toBe(false)
    expect(jePlatnyEIC('10YCZ-CEPS')).toBe(false)
    expect(jePlatnyEIC('10YCZ_CEPS-----N')).toBe(false)
  })
  it('toleruje mezery a malá písmena', () => {
    expect(jePlatnyEIC('10ycz-ceps -----n')).toBe(true)
  })
})

describe('EAN-18', () => {
  it('ověří kontrolní číslici GS1', () => {
    // GTIN-13 4006381333931 doplněný nulami na 18 míst – stejný algoritmus.
    expect(jePlatnyEAN18('000004006381333931')).toBe(true)
    expect(jePlatnyEAN18('000004006381333932')).toBe(false)
  })
  it('vyžaduje přesně 18 číslic', () => {
    expect(jePlatnyEAN18('85918240000000000')).toBe(false)
    expect(jePlatnyEAN18('85918240000000000A')).toBe(false)
  })
})

describe('IČO a PSČ', () => {
  it('IČO modulo 11', () => {
    expect(jePlatneICO('45274649')).toBe(true) // ČEZ, a. s.
    expect(jePlatneICO('26463318')).toBe(true) // OTE, a.s.
    expect(jePlatneICO('45274648')).toBe(false)
  })
  it('PSČ', () => {
    expect(jePlatnePSC('756 54')).toBe(true)
    expect(jePlatnePSC('75654')).toBe(true)
    expect(jePlatnePSC('7565')).toBe(false)
  })
})

describe('Adresa na jeden řádek', () => {
  it('ulice s číslem', () => {
    expect(
      adresaNaRadek({
        ulice: 'Hlavní',
        cisloPopisne: '375',
        cisloOrientacni: '12',
        obec: 'Zubří',
        psc: '75654',
      }),
    ).toBe('Hlavní 375/12, Zubří, 756 54')
  })
  it('bez PSČ pro přehledy', () => {
    expect(
      adresaNaRadek(
        { ulice: 'Lesní', cisloPopisne: '2330', obec: 'Rožnov pod Radhoštěm', psc: '75661' },
        { psc: false },
      ),
    ).toBe('Lesní 2330, Rožnov pod Radhoštěm')
    expect(
      adresaNaRadek(
        { obec: 'Bystřička', psc: '75624', parcelniCislo: '239/3', katastralniUzemi: 'Bystřička' },
        { psc: false },
      ),
    ).toBe('Bystřička, parc. č. 239/3, k. ú. Bystřička')
  })
  it('obec bez ulic', () => {
    expect(adresaNaRadek({ cisloPopisne: '375', obec: 'Zubří', psc: '756 54' })).toBe(
      'Zubří 375, 756 54',
    )
  })
  it('místo bez čísla popisného (trafostanice) – parcela', () => {
    expect(
      adresaNaRadek({ obec: 'Vsetín', parcelniCislo: '1234/5', katastralniUzemi: 'Vsetín' }),
    ).toBe('Vsetín, parc. č. 1234/5, k. ú. Vsetín')
  })
})

describe('Interní číslo', () => {
  it('formát řad', () => {
    expect(formatujInterniCislo('EE', 7)).toBe('EE-00007')
    expect(formatujInterniCislo('ZP', 123)).toBe('ZP-00123')
  })
})
