import { backendConfig } from "@repo/test-config/backend"
import { frontendConfig } from "@repo/test-config/frontend"
import { defineConfig, mergeConfig } from "vitest/config"

// Node project: Payload config, API route handlers, server-side code (`*.test.ts`).
const nodeProject = mergeConfig(
  backendConfig,
  defineConfig({
    resolve: { tsconfigPaths: true },
    test: {
      name: "node",
      env: { TZ: "UTC" },
      setupFiles: ["./src/test-config/vitest.setup.ts"],
      include: ["src/**/*.test.ts"],
    },
  }),
)

// jsdom project: React components and hooks (`*.test.tsx`).
const domProject = mergeConfig(
  frontendConfig,
  defineConfig({
    resolve: { tsconfigPaths: true },
    test: {
      name: "dom",
      include: ["src/**/*.test.tsx"],
    },
  }),
)

// Root inherits coverage + reporters from the shared base; projects only differ by environment.
export default mergeConfig(
  backendConfig,
  defineConfig({
    test: {
      projects: [nodeProject, domProject],
    },
  }),
)
