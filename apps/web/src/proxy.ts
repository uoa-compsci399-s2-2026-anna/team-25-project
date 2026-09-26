import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { REDIRECT_PARAM, redirectTarget, withRedirect } from "@/features/auth/redirect"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { Slugs } from "./lib/payload/slugs"
import { Routes } from "./lib/routes"

const memberRoutes = new Set<string>([Routes.PROPOSALS.ROOT, Routes.COURSES.ROOT])
const guestRoutes = new Set<string>([Routes.LOGIN, Routes.REGISTER.ROOT])

/**
 * Step one of registration creates the account and logs the member in, so a
 * half-registered member reads as a guest-route intruder. Send them on to step
 * two instead of their destination, which would leave them with no way back to
 * the stepper. Keep the redirect param so step two sends the member to their
 * destination when it completes.
 */
const signedInDestination = (
  result: Awaited<ReturnType<typeof getCurrentUser>>,
  redirect: string | null,
) => {
  if (result.collection === Slugs.Collections.MEMBERS && !result.user.registrationCompletedAt) {
    return withRedirect(Routes.REGISTER.PROFILE, redirect)
  }
  return redirectTarget(redirect)
}

export async function proxy(request: NextRequest) {
  const result = await getCurrentUser()
  const { pathname, search, searchParams } = request.nextUrl

  if (memberRoutes.has(pathname) && !result.user) {
    return NextResponse.redirect(
      new URL(withRedirect(Routes.LOGIN, pathname + search), request.url),
    )
  }

  if (guestRoutes.has(pathname) && result.user) {
    const destination = signedInDestination(result, searchParams.get(REDIRECT_PARAM))
    return NextResponse.redirect(new URL(destination, request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/login", "/register", "/proposals", "/courses"],
}
