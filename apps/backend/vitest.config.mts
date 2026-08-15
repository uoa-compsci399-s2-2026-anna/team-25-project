import { backendConfig } from "@repo/test-config/backend"
import tsconfigPaths from "vite-tsconfig-paths"
import { defineConfig, mergeConfig } from "vitest/config"

export default mergeConfig(
  backendConfig,
  defineConfig({
    plugins: [tsconfigPaths()],
    test: {
      env: { TZ: "UTC" },
      setupFiles: ["./src/test-config/vitest.setup.ts"],
      include: ["tests/int/**/*.int.spec.ts"],
    },
  }),
)
