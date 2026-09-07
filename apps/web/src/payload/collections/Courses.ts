import type { CollectionConfig } from "payload"
import { Slugs } from "@/lib/payload/slugs"
import { isAdmin } from "../access"

// Stable course identity and editing permissions. Teaching-period content lives
// in courseVersions.
export const Courses: CollectionConfig = {
  slug: Slugs.Collections.COURSES,
  admin: { useAsTitle: "code", defaultColumns: ["code", "institution", "owner"] },
  access: {
    create: isAdmin,
    read: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  indexes: [{ fields: ["institution", "code"], unique: true }],
  fields: [
    { name: "code", type: "text", required: true },
    {
      name: "institution",
      type: "relationship",
      relationTo: Slugs.Collections.INSTITUTIONS,
      required: true,
    },
    { name: "owner", type: "relationship", relationTo: Slugs.Collections.MEMBERS, required: true },
    { name: "editors", type: "relationship", relationTo: Slugs.Collections.MEMBERS, hasMany: true },
    {
      name: "hasPublishedVersion",
      type: "checkbox",
      defaultValue: false,
      admin: { readOnly: true },
    },
  ],
}
