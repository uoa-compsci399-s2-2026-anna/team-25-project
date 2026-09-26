import { initials } from "@repo/shared/utils/initials"
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/components/ui"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { Slugs } from "@/lib/payload/slugs"
import { Routes } from "@/lib/routes"
import { NavGuestLinks } from "./NavGuestLinks"
import { NavUserMenu } from "./NavUserMenu"

// Isolated from Navbar so only this reads headers() (via getCurrentUser) -
// keeps the static shell (logo, nav links) prerenderable, with just this
// piece streamed in per-request behind the Suspense boundary in Navbar.
export const NavAuthStatus = async () => {
  const { collection, user } = await getCurrentUser()

  if (!user) {
    return <NavGuestLinks />
  }

  // An admin has no member directory entry of their own, so they get the admin
  // dashboard in place of a profile link - and a member has no business there.
  const isMember = collection === Slugs.Collections.MEMBERS
  const profileHref = isMember
    ? // biome-ignore lint/nursery/useReactCompiler: MEMBER builds a route, it isn't a component
      Routes.MEMBERS.MEMBER(user.id)
    : undefined

  return (
    <NavUserMenu adminHref={isMember ? undefined : Routes.ADMIN} profileHref={profileHref}>
      {/* Capped so a long name can't outgrow the logo side and shift the
          nav links off-center (Navbar's flex-1/flex-1 layout only keeps
          them centered as long as neither outer side dominates). */}
      <span className="max-w-32 truncate text-base">{`${user.firstName} ${user.lastName}`}</span>
      <Avatar>
        {collection === Slugs.Collections.MEMBERS &&
          typeof user.avatar === "object" &&
          user.avatar?.url && <AvatarImage alt="" src={user.avatar.url} />}
        <AvatarFallback>{initials(user.firstName, user.lastName)}</AvatarFallback>
      </Avatar>
    </NavUserMenu>
  )
}
