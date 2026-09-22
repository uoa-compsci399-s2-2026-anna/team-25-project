import type { Admin, Member } from "@repo/shared/payload-types"
import { headers } from "next/headers"
import { connection } from "next/server"
import { cache } from "react"
import { getPayloadClient } from "@/lib/payload/getPayloadClient"
import { Slugs } from "@/lib/payload/slugs"

type CurrentUser =
  | { collection: typeof Slugs.Collections.ADMIN; user: Admin }
  | { collection: typeof Slugs.Collections.MEMBERS; user: Member }
  | { collection: null; user: null }

// Read-only session check - never redirects or throws when unauthenticated.
// cache() dedupes repeat calls in the same request to one auth lookup.
export const getCurrentUser = cache(async (): Promise<CurrentUser> => {
  // Payload's auth check reads the clock, which blocks prerendering - without
  // this the Navbar's session lookup breaks the build for every static route.
  await connection()
  const payload = await getPayloadClient()
  const { user } = await payload.auth({ headers: await headers() })

  if (!user) return { collection: null, user: null }

  if (user.collection === Slugs.Collections.ADMIN) {
    return { collection: Slugs.Collections.ADMIN, user }
  }

  return { collection: Slugs.Collections.MEMBERS, user }
})
