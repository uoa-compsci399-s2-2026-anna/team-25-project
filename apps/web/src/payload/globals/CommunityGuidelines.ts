import type { GlobalConfig } from "payload"
import { Slugs } from "@/lib/payload/slugs"
import { isAdmin } from "../access"
import { revalidateCommunityGuidelines } from "../hooks/CommunityGuidelines"

export const CommunityGuidelines: GlobalConfig = {
  slug: Slugs.Globals.COMMUNITY_GUIDELINES,
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
  hooks: { afterChange: [revalidateCommunityGuidelines] },
}
