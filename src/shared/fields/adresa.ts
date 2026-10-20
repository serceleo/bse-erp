import type { Field, GroupField } from 'payload'

import { jePlatnePSC } from '../validators/identifikatory'

export type Adresa = {
  ulice?: string | null
  cisloPopisne?: string | null
  cisloOrientacni?: string | null
  obec?: string | null
  castObce?: string | null
  psc?: string | null
  katastralniUzemi?: string | null
  parcelniCislo?: string | null
}

/**
 * Složí adresu do jednoho řádku, např. „Hlavní 375/12, Zubří, 756 54“.
 * Pokud chybí obec (typicky trafostanice, výrobna), použije parcelu.
 * `psc: false` vynechá PSČ (kompaktní zobrazení v přehledech).
 */
export const adresaNaRadek = (a?: Adresa | null, { psc: sPsc = true } = {}): string => {
  if (!a) return ''
  const cislo = [a.cisloPopisne, a.cisloOrientacni].filter(Boolean).join('/')
  const psc = sPsc && a.psc ? a.psc.replace(/^(\d{3})\s?(\d{2})$/, '$1 $2') : ''
  const parcela = a.parcelniCislo
    ? `parc. č. ${a.parcelniCislo}${a.katastralniUzemi ? `, k. ú. ${a.katastralniUzemi}` : ''}`
    : ''

  let prvni = ''
  let obec = a.obec ?? ''
  if (a.ulice) {
    // „Hlavní 375/12, Vsetín – Rokytnice“
    prvni = [a.ulice, cislo].filter(Boolean).join(' ')
    if (a.castObce && a.castObce !== a.obec) obec = [a.obec, a.castObce].filter(Boolean).join(' – ')
  } else if (cislo) {
    // Obce bez ulic: „Zubří 375“, resp. „Hrachovec 12, Valašské Meziříčí“
    const nazev = a.castObce || a.obec || ''
    prvni = [nazev, cislo].filter(Boolean).join(' ')
    if (nazev === a.obec) obec = ''
  }

  // Parcelu uvádíme jen tam, kde chybí číslo budovy – jinak by adresa zbytečně bobtnala.
  return [prvni, obec, psc, cislo ? '' : parcela].filter(Boolean).join(', ')
}

/**
 * Znovupoužitelná skupina polí s adresou (OM, sídlo zákazníka, korespondenční adresa…).
 * Parcelu podporujeme proto, že řada OM (trafostanice, výrobny) nemá číslo popisné.
 */
export const adresaField = (overrides: Partial<GroupField> = {}): GroupField => ({
  name: 'adresa',
  label: 'Adresa',
  type: 'group',
  ...overrides,
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'ulice', label: 'Ulice', type: 'text', admin: { width: '50%' } },
        { name: 'cisloPopisne', label: 'Č. p. / ev.', type: 'text', admin: { width: '25%' } },
        { name: 'cisloOrientacni', label: 'Č. or.', type: 'text', admin: { width: '25%' } },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'obec', label: 'Obec', type: 'text', admin: { width: '40%' } },
        { name: 'castObce', label: 'Část obce', type: 'text', admin: { width: '35%' } },
        {
          name: 'psc',
          label: 'PSČ',
          type: 'text',
          admin: { width: '25%' },
          validate: (value: string | null | undefined) =>
            !value || jePlatnePSC(value) || 'PSČ musí mít 5 číslic (např. 756 54).',
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'katastralniUzemi',
          label: 'Katastrální území',
          type: 'text',
          admin: { width: '50%', description: 'Vyplňte, pokud místo nemá číslo popisné.' },
        },
        { name: 'parcelniCislo', label: 'Parcelní číslo', type: 'text', admin: { width: '50%' } },
      ],
    },
  ] satisfies Field[],
})
