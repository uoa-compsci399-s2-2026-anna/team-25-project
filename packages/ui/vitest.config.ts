import { uiConfig } from "@repo/test-config/ui"
import { defineConfig, mergeConfig } from "vitest/config"

export default mergeConfig(
  uiConfig,
  defineConfig({
    test: {
      setupFiles: ["./src/test-config/vitest.setup.ts"],
      coverage: {
        thresholds: {
          lines: 80,
          functions: 80,
          branches: 80,
          statements: 80,
        },
      },
    },
  }),
)
