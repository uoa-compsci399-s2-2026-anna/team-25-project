import Link from "next/link"
import { navbarLinks, visibleLinks } from "@/features/layout/links"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"

// Isolated from Navbar for the same reason as NavAuthStatus - only this piece
// reads headers(), so the logo stays in the prerendered shell.
export const NavLinks = async () => {
  const { user } = await getCurrentUser()
  return renderNavLinks(Boolean(user))
}

/** What NavLinks falls back to when the user cannot be read. */
export const GuestNavLinks = () => renderNavLinks(false)

const renderNavLinks = (signedIn: boolean) =>
  visibleLinks(navbarLinks, signedIn).map((link) => (
    <Link
      className="text-base transition-opacity hover:opacity-70"
      href={link.href}
      key={link.name}
    >
      {link.name}
    </Link>
  ))
