import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  transpilePackages: ["@repo/ui"],
  cacheComponents: true,
  reactCompiler: true,
  typedRoutes: true,
}

export default nextConfig
