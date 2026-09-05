import type { Access, FieldAccess } from "payload"
import { Slugs } from "@/lib/payload/slugs"

export const isAdmin: Access = ({ req }) => req.user?.collection === Slugs.Collections.ADMIN

export const isAdminOrSelf: Access = ({ req }) => {
  if (req.user?.collection === Slugs.Collections.ADMIN) return true
  if (req.user?.collection === Slugs.Collections.MEMBERS) return { id: { equals: req.user.id } }
  return false
}

export const isSignedIn: Access = ({ req }) => Boolean(req.user)

// Visible to signed-in requesters, or to anyone if the member opted in via showEmailPublicly.
export const canReadEmail: FieldAccess = ({ req, doc }) =>
  Boolean(req.user) || Boolean(doc?.showEmailPublicly)
