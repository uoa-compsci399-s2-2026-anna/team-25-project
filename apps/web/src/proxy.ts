import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { Slugs } from "./lib/payload/slugs"
import { Routes } from "./lib/routes"

const memberRoutes = new Set<string>([Routes.PROPOSALS.ROOT, Routes.COURSES.ROOT])
const guestRoutes = new Set<string>([Routes.LOGIN, Routes.REGISTER.ROOT])

/**
 * Step one of registration creates the account and logs the member in, so a
 * half-registered member reads as a guest-route intruder. Send them on to step
 * two instead of home, which would leave them with no way back to the stepper.
 */
const signedInDestination = (result: Awaited<ReturnType<typeof getCurrentUser>>) => {
  if (result.collection === Slugs.Collections.MEMBERS && !result.user.registrationCompletedAt) {
    return Routes.REGISTER.PROFILE
  }
  return Routes.HOME
}

export async function proxy(request: NextRequest) {
  const result = await getCurrentUser()
  const { pathname } = request.nextUrl

  if (memberRoutes.has(pathname) && !result.user) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  if (guestRoutes.has(pathname) && result.user) {
    return NextResponse.redirect(new URL(signedInDestination(result), request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/login", "/register", "/proposals", "/courses"],
}
