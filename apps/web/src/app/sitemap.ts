import type { MetadataRoute } from "next"
import { getMemberSitemapEntriesCached } from "@/features/members/members.queries"
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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const members = await getMemberSitemapEntriesCached()
  return [
    ...publicRoutes.map((route) => ({ url: new URL(route, siteUrl).href })),
    ...members.map((member) => ({
      url: new URL(Routes.MEMBERS.MEMBER(member.id), siteUrl).href,
      lastModified: member.updatedAt,
    })),
  ]
}
