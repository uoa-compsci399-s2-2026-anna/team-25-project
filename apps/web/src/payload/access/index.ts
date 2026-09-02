import type { Access } from "payload"
import { Slugs } from "@/lib/payload/slugs"

export const isAdmin: Access = ({ req }) => req.user?.collection === Slugs.Collections.ADMIN

export const isAdminOrSelf: Access = ({ req }) => {
  if (req.user?.collection === Slugs.Collections.ADMIN) return true
  if (req.user?.collection === Slugs.Collections.MEMBERS) return { id: { equals: req.user.id } }
  return false
}
