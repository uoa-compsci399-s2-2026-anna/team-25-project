import type { Access } from "payload"

export const isAdmin: Access = ({ req }) => req.user?.collection === "admin"

export const isAdminOrSelf: Access = ({ req }) => {
  if (req.user?.collection === "admin") return true
  if (req.user?.collection === "members") return { id: { equals: req.user.id } }
  return false
}
