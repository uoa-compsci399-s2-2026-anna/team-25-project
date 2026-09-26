import { Avatar, AvatarFallback, Heading, Skeleton } from "@repo/ui/components/ui"
import Link from "next/link"
import { Suspense } from "react"
import { Routes } from "@/lib/routes"
import { NavAuthStatus } from "./NavAuthStatus"
import { NavLinks } from "./NavLinks"

export const Navbar = () => {
  return (
    <header className="sticky top-0 z-50 flex w-full items-center gap-4 border-border border-b bg-brand-blush/60 px-4 py-4 backdrop-blur-sm md:px-8">
      {/* flex-1 on both this and the auth-status slot keeps nav mathematically
          centered regardless of either side's content width - signed-in,
          signed-out and the skeleton are all different widths, and none of
          them should be able to nudge the links left or right. */}
      <Link className="flex flex-1 items-center gap-2" href={Routes.HOME}>
        <Avatar>
          <AvatarFallback />
        </Avatar>
        <Heading level="h4">CCCA</Heading>
      </Link>

      <nav aria-label="Main" className="flex items-center gap-5">
        <Suspense
          fallback={
            // One bar per guest link - the signed-in set is longer, but the
            // flex-1 sides keep the nav centered as it grows.
            <>
              <Skeleton className="h-6 w-12 rounded-full" />
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-18 rounded-full" />
              <Skeleton className="h-6 w-10 rounded-full" />
            </>
          }
        >
          <NavLinks />
        </Suspense>
      </nav>

      <div className="flex flex-1 justify-end">
        <Suspense
          fallback={
            // Matches NavGuestLinks's layout exactly (same
            // container, same gap-4) so nothing shifts vertically once the
            // real content streams in - both bars share the real Join CCCA
            // button's h-6 height for a uniform placeholder.
            <div className="flex items-center gap-4">
              <Skeleton className="h-6 w-12 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          }
        >
          <NavAuthStatus />
        </Suspense>
      </div>
    </header>
  )
}
