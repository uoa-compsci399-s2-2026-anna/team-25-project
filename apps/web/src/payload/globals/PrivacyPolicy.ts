import type { GlobalConfig } from "payload"
import { Slugs } from "@/lib/payload/slugs"
import { isAdmin } from "../access"

export const PrivacyPolicy: GlobalConfig = {
  slug: Slugs.Globals.PRIVACY_POLICY,
  access: {
    read: () => true,
    update: isAdmin,
  },
  fields: [
    {
      name: "content",
      type: "richText",
      required: true,
    },
  ],
}
