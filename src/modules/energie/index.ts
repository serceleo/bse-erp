/**
 * Modul Energie – evidence odběrných míst, zákazníků a smluv.
 *
 * Modul se do ERP zapojuje přes `energieModul` v payload.config.ts. Další moduly
 * (fakturace, nákup, reporty…) se přidávají stejným způsobem jako samostatné složky
 * v src/modules – každý si nese vlastní kolekce, hooky a inicializaci.
 */
import type { CollectionConfig, Payload } from 'payload'

import { OdbernaMista } from './collections/OdbernaMista'
import { Smlouvy } from './collections/Smlouvy'
import { SouboryOM } from './collections/SouboryOM'
import { Zakaznici } from './collections/Zakaznici'
import { synchronizujCiselneRady } from './lib/ciselneRady'

export const energieModul: {
  collections: CollectionConfig[]
  onInit: (payload: Payload) => Promise<void>
} = {
  collections: [OdbernaMista, Zakaznici, SouboryOM, Smlouvy],
  onInit: synchronizujCiselneRady,
}
