import { Avatar, AvatarFallback, AvatarImage, buttonVariants } from "@repo/ui/components/ui"
import Link from "next/link"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { Slugs } from "@/lib/payload/slugs"
import { Routes } from "@/lib/routes"

const initials = (firstName: string, lastName: string) =>
  `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase()

// Isolated from Navbar so only this reads headers() (via getCurrentUser) -
// keeps the static shell (logo, nav links) prerenderable, with just this
// piece streamed in per-request behind the Suspense boundary in Navbar.
export const NavAuthStatus = async () => {
  const { collection, user } = await getCurrentUser()

  if (!user) {
    return (
      <div className="flex items-center gap-4">
        {/* TODO: point to a real login page once a login form lands */}
        <Link className="text-base transition-opacity hover:opacity-70" href={Routes.HOME}>
          Log in
        </Link>
        <Link className={buttonVariants({ size: "sm" })} href={Routes.HOME}>
          Join CCCA
        </Link>
      </div>
    )
  }

  return (
    <Link
      className="flex min-w-0 items-center gap-2 transition-opacity hover:opacity-70"
      // TODO: point to the real profile page once #89 lands
      href={Routes.HOME}
    >
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
    </Link>
  )
}
