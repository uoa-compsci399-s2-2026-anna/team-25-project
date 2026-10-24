import type { MetadataRoute } from "next"
import { siteUrl } from "@/lib/siteUrl"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/payload/", "/api/"] },
    sitemap: new URL("/sitemap.xml", siteUrl).href,
  }
}
