import { uiConfig } from "@repo/test-config/ui"
import { defineConfig, mergeConfig } from "vitest/config"

export default mergeConfig(
  uiConfig,
  defineConfig({
    test: {
      setupFiles: ["./src/test-config/vitest.setup.ts"],
      coverage: {
        thresholds: {
          lines: 85,
          functions: 85,
          branches: 85,
          statements: 85,
        },
      },
    },
  }),
)
