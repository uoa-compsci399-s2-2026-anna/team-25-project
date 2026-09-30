import { Routes } from "@/lib/routes"

export const siteLinks = {
  about: { name: "About", href: Routes.ABOUT, membersOnly: false },
  members: { name: "Members", href: Routes.MEMBERS.ROOT, membersOnly: false },
  courses: { name: "Courses", href: Routes.COURSES.ROOT, membersOnly: true },
  proposals: { name: "Proposals", href: Routes.PROPOSALS.ROOT, membersOnly: true },
  resources: { name: "Resources", href: Routes.RESOURCES, membersOnly: false },
  news: { name: "News", href: Routes.NEWS, membersOnly: false },
  privacy: { name: "Privacy", href: Routes.PRIVACY, membersOnly: false },
} as const

export type SiteLink = (typeof siteLinks)[keyof typeof siteLinks]

export const visibleLinks = <T extends { membersOnly: boolean }>(
  links: readonly T[],
  signedIn: boolean,
) => links.filter((link) => signedIn || !link.membersOnly)
