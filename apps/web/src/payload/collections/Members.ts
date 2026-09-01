import type { CollectionConfig } from "payload"
import { isAdmin, isAdminOrSelf } from "../access"

export const Members: CollectionConfig = {
  slug: "members",
  admin: {
    useAsTitle: "email",
  },
  auth: {
    maxLoginAttempts: 5,
    lockTime: 1000 * 60 * 15, // 15 min lockout
    tokenExpiration: 60 * 60 * 8, // 8 h
    useSessions: true,
    cookies: {
      sameSite: "Lax",
      secure: process.env.NODE_ENV === "production",
    },
  },
  access: {
    create: () => true, // public registration
    read: () => true, // public directory; sensitive fields gated below
    update: isAdminOrSelf,
    delete: isAdmin,
  },
  fields: [
    {
      // Overrides the email field Payload adds by default, so we can gate who can read it.
      name: "email",
      type: "email",
      access: {
        read: ({ req, doc }) => Boolean(req.user) || Boolean(doc?.showEmailPublicly),
      },
    },
    { name: "firstName", type: "text", required: true },
    { name: "lastName", type: "text", required: true },
    { name: "position", type: "text" },
    { name: "bio", type: "textarea" },
    { name: "avatar", type: "upload", relationTo: "media" },
    {
      name: "showEmailPublicly",
      type: "checkbox",
      defaultValue: false,
      label: "Show my email address to visitors who aren't signed in",
    },
    {
      name: "lastReviewedAt",
      type: "date",
      admin: { readOnly: true, position: "sidebar" },
    },
  ],
}
