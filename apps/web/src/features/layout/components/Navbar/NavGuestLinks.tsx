"use client"

import { buttonVariants } from "@repo/ui/components/ui"
import Link from "next/link"
import { withRedirect } from "@/features/auth/redirect"
import { Routes } from "@/lib/routes"
import { useAuthRedirectTarget } from "./useAuthRedirectTarget"

/** Client-side so the links can send the user back to the page they are on after auth. */
export const NavGuestLinks = () => {
  const target = useAuthRedirectTarget()

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
