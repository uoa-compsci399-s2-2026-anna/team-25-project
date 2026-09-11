import { describe, expect, it } from "vitest"
import nextConfig from "../next.config"

describe("Next configuration", () => {
  it("enables partial prefetching with Cache Components", () => {
    expect(nextConfig.cacheComponents).toBe(true)
    expect(nextConfig.partialPrefetching).toBe(true)
  })

  it("adds TypeScript extension aliases to webpack", () => {
    const webpackConfig = { resolve: {} } as {
      resolve: { extensionAlias?: Record<string, string[]> }
    }
    const configureWebpack = nextConfig.webpack as (
      config: typeof webpackConfig,
      options: { webpack: { IgnorePlugin: new (options: object) => object } },
    ) => typeof webpackConfig
    class IgnorePlugin {}

    const result = configureWebpack(webpackConfig, { webpack: { IgnorePlugin } })

    expect(result.resolve.extensionAlias).toEqual({
      ".cjs": [".cts", ".cjs"],
      ".js": [".ts", ".tsx", ".js", ".jsx"],
      ".mjs": [".mts", ".mjs"],
    })
  })
})
