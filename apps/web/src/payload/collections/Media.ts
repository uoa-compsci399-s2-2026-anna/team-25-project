import type { CollectionConfig } from "payload"
import { Slugs } from "@/lib/payload/slugs"
import { isAdmin, isSignedIn } from "../access"

export const Media: CollectionConfig = {
  slug: Slugs.Collections.MEDIA,
  access: {
    read: () => true,
    create: isSignedIn,
    // An upload row carries no owner to scope against, so members cannot change or
    // remove one directly. updateMemberProfile deletes a member's own old avatar.
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    {
      name: "alt",
      type: "text",
      required: true,
    },
  ],
  upload: {
    // Excludes image/svg+xml deliberately - an SVG can carry an embedded <script>.
    mimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  },
}
