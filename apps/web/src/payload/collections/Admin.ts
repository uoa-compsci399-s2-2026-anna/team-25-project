import type { CollectionConfig } from "payload"
import { Slugs } from "@/lib/payload/slugs"
import { isAdmin } from "../access"

export const Admin: CollectionConfig = {
  slug: Slugs.Collections.ADMIN,
  admin: {
    useAsTitle: "email",
    group: "System",
  },
  auth: true,
  access: {
    read: isAdmin,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    { name: "firstName", type: "text", required: true },
    { name: "lastName", type: "text", required: true },
  ],
}
