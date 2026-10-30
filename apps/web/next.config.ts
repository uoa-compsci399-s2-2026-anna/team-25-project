import { withPayload } from "@payloadcms/next/withPayload"
import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // The e2e server builds into its own directory, so it can run next to a dev server.
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  output: "standalone",
  transpilePackages: ["@repo/ui"],
  cacheComponents: true,
  reactCompiler: true,
  partialPrefetching: true,
  typedRoutes: true,
  experimental: {
    serverActions: {
      // Default is 1 MB. Applies to every action and is read before any of them runs, so it
      // stays small: room for createResource's attachments, capped at
      // RESOURCE_ATTACHMENTS_MAX_MB (9 MB), plus the form's other fields. RegisterProfileForm
      // caps an avatar at 4 MB itself.
      bodySizeLimit: "10mb",
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Stops other sites framing the app to trick a signed-in member into clicking.
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          // Uploaded attachments are served from our origin, so browsers must not guess their type.
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Keeps reset tokens in URLs from reaching other sites.
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          ...(process.env.NODE_ENV === "production"
            ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }]
            : []),
        ],
      },
    ]
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
