"use client"

import { usePathname, useSearchParams } from "next/navigation"
import { isAuthRoute, REDIRECT_PARAM } from "@/features/auth/redirect"

/** The page to return to after logging in or joining. */
export const useAuthRedirectTarget = () => {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const search = searchParams.toString()
  // On an auth page, pass on the destination the user already has, not the auth page.
  return isAuthRoute(pathname)
    ? searchParams.get(REDIRECT_PARAM)
    : search
      ? `${pathname}?${search}`
      : pathname
}
