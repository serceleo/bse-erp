'use client'
/**
 * Kompaktní buňky pro seznam odběrných míst (a tabulky OM v detailu zákazníka či smlouvy).
 * Plný popis hodnoty je vždy dostupný v bublině (title) a pro odečítače obrazovky (aria-label).
 */
import type { DefaultCellComponentProps } from 'payload'
import React from 'react'

const popisek = (field: DefaultCellComponentProps['field'], hodnota: string): string => {
  if (!('options' in field) || !Array.isArray(field.options)) return hodnota
  const o = field.options.find((x) => (typeof x === 'string' ? x : x.value) === hodnota)
  if (!o || typeof o === 'string') return hodnota
  return typeof o.label === 'string' ? o.label : hodnota
}

const Blesk = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M13.5 2 4 13.5h6.5L9 22l11-12.5h-6.8L13.5 2Z" fill="#F28C00" />
  </svg>
)

const Plamen = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="#1E73D8"
      d="M12 12.9l-2.13 2.09c-.56.56-.87 1.29-.87 2.07C9 18.68 10.35 20 12 20s3-1.32 3-2.94c0-.78-.31-1.52-.87-2.07L12 12.9zM16 6l-.44.55C14.38 8.02 12 7.19 12 5.3V2S4 6 4 13c0 2.92 1.56 5.47 3.89 6.86-.56-.79-.89-1.76-.89-2.8 0-1.32.52-2.56 1.47-3.5L12 10.1l3.53 3.47c.95.93 1.47 2.17 1.47 3.5 0 1.02-.31 1.96-.85 2.75 1.89-1.15 3.29-3.06 3.71-5.3.66-3.55-1.07-6.9-3.86-8.52z"
    />
  </svg>
)

/** Komodita jako ikona: oranžový blesk = elektřina, modrý plamínek = plyn. */
export const KomoditaBunka: React.FC<DefaultCellComponentProps> = ({ cellData, field }) => {
  if (cellData !== 'EE' && cellData !== 'ZP') return null
  const nazev = popisek(field, cellData)
  return (
    <span title={nazev} aria-label={nazev} role="img" style={{ display: 'inline-flex' }}>
      {cellData === 'EE' ? <Blesk /> : <Plamen />}
    </span>
  )
}

/** Výběr zobrazený jen zkratkou (uloženou hodnotou), plný popis v bublině. */
export const ZkratkaBunka: React.FC<DefaultCellComponentProps> = ({ cellData, field }) => {
  if (typeof cellData !== 'string' || !cellData) return null
  const nazev = popisek(field, cellData)
  return (
    <span title={nazev} aria-label={nazev}>
      {cellData}
    </span>
  )
}
