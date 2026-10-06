import Link from "next/link"
import { navbarLinks, visibleLinks } from "@/features/layout/links"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"

// Isolated from Navbar for the same reason as NavAuthStatus - only this piece
// reads headers(), so the logo stays in the prerendered shell.
export const NavLinks = async () => {
  const { user } = await getCurrentUser()

  return visibleLinks(navbarLinks, Boolean(user)).map((link) => (
    <Link
      className="text-base transition-opacity hover:opacity-70"
      href={link.href}
      key={link.name}
    >
      {link.name}
    </Link>
  ))
}
