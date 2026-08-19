import { backendConfig } from "@repo/test-config/backend"
import { defineConfig, mergeConfig } from "vitest/config"

export default mergeConfig(
  backendConfig,
  defineConfig({
    resolve: { tsconfigPaths: true },
    test: {
      env: { TZ: "UTC" },
      setupFiles: ["./src/test-config/vitest.setup.ts"],
      include: ["tests/int/**/*.int.spec.ts"],
    },
  }),
)
