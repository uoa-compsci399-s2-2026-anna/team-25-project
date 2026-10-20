import type { MetadataRoute } from "next"
import { Routes } from "@/lib/routes"
import { siteUrl } from "@/lib/siteUrl"

// Only pages a guest can read. Member-only pages redirect a crawler to the login page.
const publicRoutes = [
  Routes.HOME,
  Routes.MEMBERS.ROOT,
  Routes.PUBLICATIONS,
  Routes.REGISTER.ROOT,
  Routes.LOGIN,
  Routes.PRIVACY,
]

export default function sitemap(): MetadataRoute.Sitemap {
  return publicRoutes.map((route) => ({ url: new URL(route, siteUrl).href }))
}
