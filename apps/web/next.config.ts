import { withPayload } from "@payloadcms/next/withPayload"
import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  transpilePackages: ["@repo/ui"],
  cacheComponents: true,
  reactCompiler: true,
  partialPrefetching: true,
  typedRoutes: true,
  experimental: {
    serverActions: {
      // Default is 1 MB; a normal phone photo is 2-5 MB and completeProfile
      // uploads one via FormData. Matches RegisterProfileForm's own client-side
      // MAX_AVATAR_BYTES check.
      bodySizeLimit: "4mb",
    },
  },
  images: {
    localPatterns: [
      {
        pathname: "/payload/api/media/file/**",
      },
    ],
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      ".cjs": [".cts", ".cjs"],
      ".js": [".ts", ".tsx", ".js", ".jsx"],
      ".mjs": [".mts", ".mjs"],
    }

    return webpackConfig
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
