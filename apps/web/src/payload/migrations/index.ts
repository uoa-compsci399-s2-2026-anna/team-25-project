import * as migration_20260831_132328_initial from './20260831_132328_initial';
import * as migration_20260902_042459 from './20260902_042459';
import * as migration_20260903_210942 from './20260903_210942';
import * as migration_20260903_215417 from './20260903_215417';
import * as migration_20260905_050932 from './20260905_050932';
import * as migration_20260907_002652 from './20260907_002652';
import * as migration_20260912_000149 from './20260912_000149';
import * as migration_20260912_044359 from './20260912_044359';
import * as migration_20260917_025755 from './20260917_025755';
import * as migration_20260925_062106 from './20260925_062106';

export const migrations = [
  {
    up: migration_20260831_132328_initial.up,
    down: migration_20260831_132328_initial.down,
    name: '20260831_132328_initial',
  },
  {
    up: migration_20260902_042459.up,
    down: migration_20260902_042459.down,
    name: '20260902_042459',
  },
  {
    up: migration_20260903_210942.up,
    down: migration_20260903_210942.down,
    name: '20260903_210942',
  },
  {
    up: migration_20260903_215417.up,
    down: migration_20260903_215417.down,
    name: '20260903_215417',
  },
  {
    up: migration_20260905_050932.up,
    down: migration_20260905_050932.down,
    name: '20260905_050932',
  },
  {
    up: migration_20260907_002652.up,
    down: migration_20260907_002652.down,
    name: '20260907_002652',
  },
  {
    up: migration_20260912_000149.up,
    down: migration_20260912_000149.down,
    name: '20260912_000149',
  },
  {
    up: migration_20260912_044359.up,
    down: migration_20260912_044359.down,
    name: '20260912_044359',
  },
  {
    up: migration_20260917_025755.up,
    down: migration_20260917_025755.down,
    name: '20260917_025755',
  },
  {
    up: migration_20260925_062106.up,
    down: migration_20260925_062106.down,
    name: '20260925_062106'
  },
];
