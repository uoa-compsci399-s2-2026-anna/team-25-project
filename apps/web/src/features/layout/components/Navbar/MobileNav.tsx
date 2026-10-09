import { initials } from "@repo/shared/utils/initials"
import { navbarLinks, visibleLinks } from "@/features/layout/links"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { Slugs } from "@/lib/payload/slugs"
import { Routes } from "@/lib/routes"
import { type MobileNavAccount, MobileNavMenu } from "./MobileNavMenu"

export const MobileNav = async () => {
  const { collection, user } = await getCurrentUser()
  const links = visibleLinks(navbarLinks, Boolean(user)).map(({ href, name }) => ({ href, name }))

  if (!user) {
    return <MobileNavMenu key="guest" links={links} />
  }

  const name = `${user.firstName} ${user.lastName}`
  const base = { initials: initials(user.firstName, user.lastName), name }

  const account: MobileNavAccount =
    collection === Slugs.Collections.MEMBERS
      ? {
          ...base,
          avatarUrl:
            typeof user.avatar === "object" && user.avatar?.url ? user.avatar.url : undefined,
          // biome-ignore lint/nursery/useReactCompiler: MEMBER builds a route, it isn't a component
          href: Routes.MEMBERS.MEMBER(user.id),
          hrefLabel: "My Profile",
          subtitle: typeof user.institution === "object" ? user.institution.name : user.position,
        }
      : { ...base, href: Routes.ADMIN, hrefLabel: "Admin dashboard", subtitle: "Administrator" }

  return <MobileNavMenu account={account} key={`${collection}-${user.id}`} links={links} />
}
