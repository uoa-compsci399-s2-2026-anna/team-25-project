import { frontendConfig } from "@repo/test-config/frontend"
import tsconfigPaths from "vite-tsconfig-paths"
import { defineConfig, mergeConfig } from "vitest/config"

export default mergeConfig(
  frontendConfig,
  defineConfig({
    plugins: [tsconfigPaths()],
    test: {
      setupFiles: ["./test-config/vitest.setup.tsx"],
    },
  }),
)
