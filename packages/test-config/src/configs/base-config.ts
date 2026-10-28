import react from "@vitejs/plugin-react-swc"
import { defineConfig } from "vitest/config"

// Shared defaults every environment-specific config extends via mergeConfig.
export const baseConfig = defineConfig({
  plugins: [react()],
  test: {
    coverage: {
      provider: "istanbul",
      reporter: ["text", "json", "json-summary", "html"],
      reportsDirectory: "./coverage",
      thresholds: {
        lines: 85,
        functions: 85,
        branches: 85,
        statements: 85,
      },
    },
  },
})
