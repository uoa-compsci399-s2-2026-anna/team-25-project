import { Routes } from "@/lib/routes"

// Shared by Navbar and Footer so both show the same pages to the same people.
// Courses, Proposals and Resources are in proxy.ts's memberRoutes, so a guest
// following any of them would only be redirected to login.
export const siteLinks = {
  home: { name: "Home", href: Routes.HOME, membersOnly: false },
  members: { name: "Members", href: Routes.MEMBERS.ROOT, membersOnly: false },
  courses: { name: "Courses", href: Routes.COURSES.ROOT, membersOnly: true },
  proposals: { name: "Proposals", href: Routes.PROPOSALS.ROOT, membersOnly: true },
  publications: { name: "Publications", href: Routes.PUBLICATIONS, membersOnly: false },
  resources: { name: "Resources", href: Routes.RESOURCES.ROOT, membersOnly: true },
  privacy: { name: "Privacy", href: Routes.PRIVACY, membersOnly: false },
} as const

// Shown by both the desktop and mobile navbars.
export const navbarLinks = [
  siteLinks.home,
  siteLinks.members,
  siteLinks.courses,
  siteLinks.proposals,
  siteLinks.publications,
  siteLinks.resources,
]

export type SiteLink = (typeof siteLinks)[keyof typeof siteLinks]

export const visibleLinks = <T extends { membersOnly: boolean }>(
  links: readonly T[],
  signedIn: boolean,
) => links.filter((link) => signedIn || !link.membersOnly)
