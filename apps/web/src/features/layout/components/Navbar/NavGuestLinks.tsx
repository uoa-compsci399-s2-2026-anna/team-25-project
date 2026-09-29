"use client"

import { buttonVariants } from "@repo/ui/components/ui"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { isAuthRoute, REDIRECT_PARAM, withRedirect } from "@/features/auth/redirect"
import { Routes } from "@/lib/routes"

/** Client-side so the links can send the user back to the page they are on after auth. */
export const NavGuestLinks = () => {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const search = searchParams.toString()
  // On an auth page, pass on the destination the user already has, not the auth page.
  const target = isAuthRoute(pathname)
    ? searchParams.get(REDIRECT_PARAM)
    : search
      ? `${pathname}?${search}`
      : pathname

  return (
    <div className="flex items-center gap-4">
      <Link
        className="text-base transition-opacity hover:opacity-70"
        href={withRedirect(Routes.LOGIN, target)}
      >
        Log in
      </Link>
      <Link
        className={buttonVariants({ size: "sm" })}
        href={withRedirect(Routes.REGISTER.ROOT, target)}
      >
        Join CCCA
      </Link>
    </div>
  )
}
