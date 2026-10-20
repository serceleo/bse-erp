import * as migration_20261019_215955_init from './20261019_215955_init'
import * as migration_20261019_225828_zruseni_rezervovane_kapacity from './20261019_225828_zruseni_rezervovane_kapacity'
import * as migration_20261019_230934_sloucene_typy_om from './20261019_230934_sloucene_typy_om'
import * as migration_20261020_001810_typ_odberu_plynu_dle_spotreby from './20261020_001810_typ_odberu_plynu_dle_spotreby'
import * as migration_20261020_124428_zakaznik_nepovinny from './20261020_124428_zakaznik_nepovinny'
import * as migration_20261020_173143_hledani_podle_zakaznika from './20261020_173143_hledani_podle_zakaznika'
import * as migration_20261020_174031_rucni_kategorie_plynu from './20261020_174031_rucni_kategorie_plynu'
import * as migration_20261020_184500_evidence_vyroben from './20261020_184500_evidence_vyroben'

export const migrations = [
  {
    up: migration_20261019_215955_init.up,
    down: migration_20261019_215955_init.down,
    name: '20261019_215955_init',
  },
  {
    up: migration_20261019_225828_zruseni_rezervovane_kapacity.up,
    down: migration_20261019_225828_zruseni_rezervovane_kapacity.down,
    name: '20261019_225828_zruseni_rezervovane_kapacity',
  },
  {
    up: migration_20261019_230934_sloucene_typy_om.up,
    down: migration_20261019_230934_sloucene_typy_om.down,
    name: '20261019_230934_sloucene_typy_om',
  },
  {
    up: migration_20261020_001810_typ_odberu_plynu_dle_spotreby.up,
    down: migration_20261020_001810_typ_odberu_plynu_dle_spotreby.down,
    name: '20261020_001810_typ_odberu_plynu_dle_spotreby',
  },
  {
    up: migration_20261020_124428_zakaznik_nepovinny.up,
    down: migration_20261020_124428_zakaznik_nepovinny.down,
    name: '20261020_124428_zakaznik_nepovinny',
  },
  {
    up: migration_20261020_173143_hledani_podle_zakaznika.up,
    down: migration_20261020_173143_hledani_podle_zakaznika.down,
    name: '20261020_173143_hledani_podle_zakaznika',
  },
  {
    up: migration_20261020_174031_rucni_kategorie_plynu.up,
    down: migration_20261020_174031_rucni_kategorie_plynu.down,
    name: '20261020_174031_rucni_kategorie_plynu',
  },
  {
    up: migration_20261020_184500_evidence_vyroben.up,
    down: migration_20261020_184500_evidence_vyroben.down,
    name: '20261020_184500_evidence_vyroben',
  },
]
