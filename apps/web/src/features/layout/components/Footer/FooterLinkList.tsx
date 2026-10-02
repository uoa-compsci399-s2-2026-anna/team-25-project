import Link from "next/link"
import { type SiteLink, visibleLinks } from "@/features/layout/links"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"

type FooterLinkListProps = {
  links: readonly SiteLink[]
}

// Isolated from Footer for the same reason as NavLinks - only this piece reads
// headers(), so the brand and group headings stay in the prerendered shell.
export const FooterLinkList = async ({ links }: FooterLinkListProps) => {
  const { user } = await getCurrentUser()

  return (
    <ul>
      {visibleLinks(links, Boolean(user)).map((link) => (
        <li key={link.name}>
          <Link href={link.href}>{link.name}</Link>
        </li>
      ))}
    </ul>
  )
}
