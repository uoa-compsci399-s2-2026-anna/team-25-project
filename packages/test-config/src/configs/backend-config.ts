import { fileURLToPath } from "node:url"
import { defineConfig, mergeConfig } from "vitest/config"
import { baseConfig } from "./base-config.js"

// Resolved absolute so consumers get the right file regardless of their own cwd/root.
const mongodbSetupPath = fileURLToPath(new URL("../setups/mongodb-setup.js", import.meta.url))

export const backendConfig = mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      environment: "node",
      setupFiles: [mongodbSetupPath],
    },
  }),
)
