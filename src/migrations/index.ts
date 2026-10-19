import * as migration_20261019_215955_init from './20261019_215955_init'
import * as migration_20261019_225828_zruseni_rezervovane_kapacity from './20261019_225828_zruseni_rezervovane_kapacity'

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
]
