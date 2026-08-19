import { frontendConfig } from "@repo/test-config/frontend"
import { defineConfig, mergeConfig } from "vitest/config"

export default mergeConfig(
  frontendConfig,
  defineConfig({
    resolve: { tsconfigPaths: true },
    test: {
      setupFiles: ["./test-config/vitest.setup.tsx"],
    },
  }),
)
