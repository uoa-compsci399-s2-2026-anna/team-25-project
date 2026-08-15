import { defineConfig, mergeConfig } from "vitest/config"
import { baseConfig } from "./base-config.js"

export const backendConfig = mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      environment: "node",
    },
  }),
)
