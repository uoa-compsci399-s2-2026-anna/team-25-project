import { cookies } from "next/headers"
import type { Payload } from "payload"
import { generatePayloadCookie } from "payload/shared"
import { Slugs } from "@/lib/payload/slugs"

/**
 * Signs the member in from a server action, given a token Payload just issued
 * (on login or password reset). `login()` from `@payloadcms/next/auth` would set
 * the cookie itself, but only from an email and password.
 */
export const setSessionCookie = async (payload: Payload, token: string) => {
  const cookie = generatePayloadCookie({
    collectionAuthConfig: payload.collections[Slugs.Collections.MEMBERS].config.auth,
    cookiePrefix: payload.config.cookiePrefix,
    returnCookieAsObject: true,
    token,
  })

  const cookieStore = await cookies()
  cookieStore.set(cookie.name, cookie.value ?? "", {
    domain: cookie.domain,
    expires: cookie.expires ? new Date(cookie.expires) : undefined,
    httpOnly: cookie.httpOnly,
    maxAge: cookie.maxAge,
    path: cookie.path,
    // Payload capitalises these; Next's cookie API expects them lowercased.
    sameSite: cookie.sameSite?.toLowerCase() as "lax" | "none" | "strict" | undefined,
    secure: cookie.secure,
  })
}
