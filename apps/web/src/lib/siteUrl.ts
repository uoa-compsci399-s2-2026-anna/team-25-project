const url = process.env.NEXT_PUBLIC_URL

// Next inlines this at build time, so a production build without it would ship localhost URLs.
if (!url && process.env.NODE_ENV === "production") {
  throw new Error("NEXT_PUBLIC_URL is required for a production build")
}

/** The public origin, for absolute URLs in metadata, the sitemap and robots.txt. */
export const siteUrl = new URL(url ?? "http://localhost:3000")
