import * as migration_20260831_132328_initial from "./20260831_132328_initial"

export const migrations = [
  {
    up: migration_20260831_132328_initial.up,
    down: migration_20260831_132328_initial.down,
    name: "20260831_132328_initial",
  },
]
