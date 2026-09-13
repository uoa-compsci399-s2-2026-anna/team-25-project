import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"

const memberRoutes = new Set(["/proposals"])
const guestRoutes = new Set(["/login", "/register"])

export async function proxy(request: NextRequest) {
  const result = await getCurrentUser()
  const { pathname } = request.nextUrl

  if (memberRoutes.has(pathname) && !result.user) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  if (guestRoutes.has(pathname) && result.user) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/proposals", "/login", "/register", "/courses"],
}
