/**
 * Validace identifikátorů používaných v energetice a obchodním styku.
 *
 * Čisté funkce bez závislosti na Payloadu – lze je použít v hookách, validacích
 * polí, importních skriptech i na frontendu.
 */

/** Odstraní mezery a převede na velká písmena (uživatelé kódy často vkládají s mezerami). */
export const normalizujKod = (value: string): string => value.replace(/\s+/g, '').toUpperCase()

/**
 * EAN odběrného místa elektřiny – 18 číslic, poslední je kontrolní (algoritmus GS1).
 * V ČR začínají kódy OM prefixem 859182400, prefix ale nevynucujeme – stačí kontrolní číslice,
 * která spolehlivě zachytí překlepy.
 */
export const kontrolniCisliceEAN = (bezKontrolni: string): number => {
  // GS1: zprava doleva střídáme váhy 3, 1, 3, 1, …
  const soucet = bezKontrolni
    .split('')
    .reverse()
    .reduce((acc, c, i) => acc + Number(c) * (i % 2 === 0 ? 3 : 1), 0)
  return (10 - (soucet % 10)) % 10
}

export const jePlatnyEAN18 = (raw: string): boolean => {
  const kod = normalizujKod(raw)
  return /^\d{18}$/.test(kod) && kontrolniCisliceEAN(kod.slice(0, 17)) === Number(kod[17])
}

const EIC_ZNAKY = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ-'

/**
 * EIC (Energy Identification Code, ENTSO-E) – 16 znaků [0-9A-Z-], poslední je kontrolní.
 * Kódy OM plynu v ČR mají tvar 27ZG…
 */
export const kontrolniZnakEIC = (bezKontrolniho: string): string => {
  const soucet = bezKontrolniho
    .split('')
    .reduce((acc, znak, i) => acc + EIC_ZNAKY.indexOf(znak) * (16 - i), 0)
  return EIC_ZNAKY[36 - ((soucet - 1) % 37)]
}

export const jePlatnyEIC = (raw: string): boolean => {
  const kod = normalizujKod(raw)
  if (!/^[0-9A-Z-]{16}$/.test(kod)) return false
  const kontrolni = kontrolniZnakEIC(kod.slice(0, 15))
  // Kontrolní znak nesmí být pomlčka – taková kombinace se jako EIC nepřiděluje.
  return kontrolni !== '-' && kontrolni === kod[15]
}

/** IČO – 8 číslic, kontrolní součet modulo 11. */
export const jePlatneICO = (raw: string): boolean => {
  const ico = raw.replace(/\s+/g, '').padStart(8, '0')
  if (!/^\d{8}$/.test(ico)) return false

  const soucet = ico
    .slice(0, 7)
    .split('')
    .reduce((acc, c, i) => acc + Number(c) * (8 - i), 0)
  const zbytek = soucet % 11
  const kontrolni = zbytek === 0 ? 1 : zbytek === 1 ? 0 : 11 - zbytek

  return kontrolni === Number(ico[7])
}

/** PSČ – 5 číslic, mezera za třetí číslicí je volitelná. */
export const jePlatnePSC = (raw: string): boolean => /^\d{3}\s?\d{2}$/.test(raw.trim())
