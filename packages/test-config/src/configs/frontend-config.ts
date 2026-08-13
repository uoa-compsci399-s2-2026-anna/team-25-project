import { fileURLToPath } from "node:url"
import { defineConfig, mergeConfig } from "vitest/config"
import { baseConfig } from "./base-config.js"

// Resolved absolute so consumers get the right file regardless of their own cwd/root.
const domSetupPath = fileURLToPath(new URL("../setups/dom-setup.js", import.meta.url))

export const frontendConfig = mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      environment: "jsdom",
      setupFiles: [domSetupPath],
    },
  }),
)
