import Link from "next/link"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { Routes } from "@/lib/routes"

// Courses, Proposals and Resources are in proxy.ts's memberRoutes, so a guest
// following any of them would only be redirected to login.
const links = [
  { name: "Home", href: Routes.HOME, membersOnly: false },
  { name: "Members", href: Routes.MEMBERS.ROOT, membersOnly: false },
  { name: "Courses", href: Routes.COURSES.ROOT, membersOnly: true },
  { name: "Proposals", href: Routes.PROPOSALS.ROOT, membersOnly: true },
  { name: "Publications", href: Routes.ABOUT, membersOnly: false },
  { name: "Resources", href: Routes.RESOURCES.ROOT, membersOnly: true },
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
