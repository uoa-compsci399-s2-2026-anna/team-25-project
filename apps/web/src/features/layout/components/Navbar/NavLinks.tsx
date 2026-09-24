import Link from "next/link"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { Routes } from "@/lib/routes"

// Courses and Proposals are in proxy.ts's memberRoutes, so a guest following
// either would only be redirected home.
const links = [
  { name: "About", href: Routes.ABOUT, membersOnly: false },
  { name: "Members", href: Routes.MEMBERS.ROOT, membersOnly: false },
  { name: "Courses", href: Routes.COURSES.ROOT, membersOnly: true },
  { name: "Proposals", href: Routes.PROPOSALS.ROOT, membersOnly: true },
  { name: "Resources", href: Routes.RESOURCES, membersOnly: false },
  { name: "News", href: Routes.NEWS, membersOnly: false },
]

// Isolated from Navbar for the same reason as NavAuthStatus - only this piece
// reads headers(), so the logo stays in the prerendered shell.
export const NavLinks = async () => {
  const { user } = await getCurrentUser()

  return links
    .filter((link) => user || !link.membersOnly)
    .map((link) => (
      <Link
        className="text-base transition-opacity hover:opacity-70"
        href={link.href}
        key={link.name}
      >
        {link.name}
      </Link>
    ))
}
