import type { Access, FieldAccess } from "payload"
import { admin, member } from "./helpers"

export const isAdmin: Access = ({ req }) => admin(req)

export const isAdminOrSelf: Access = ({ req }) => {
  if (admin(req)) return true
  if (member(req)) return { id: { equals: req.user?.id } }
  return false
}

export const isSignedIn: Access = ({ req }) => Boolean(req.user)

// Visible to signed-in requesters, or to anyone if the member opted in via showEmailPublicly.
export const canReadEmail: FieldAccess = ({ req, doc }) =>
  Boolean(req.user) || Boolean(doc?.showEmailPublicly)
