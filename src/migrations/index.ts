import * as migration_20261019_215955_init from './20261019_215955_init'
import * as migration_20261019_225828_zruseni_rezervovane_kapacity from './20261019_225828_zruseni_rezervovane_kapacity'
import * as migration_20261019_230934_sloucene_typy_om from './20261019_230934_sloucene_typy_om'

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
]
