import type { CollectionConfig } from "payload"
import { Slugs } from "@/lib/payload/slugs"
import { isAdmin, isSignedIn } from "../access"

// Documents members share on resources. Kept apart from media so the public
// image store stays images-only and these stay behind a sign-in.
export const ResourceAttachments: CollectionConfig = {
  slug: Slugs.Collections.RESOURCE_ATTACHMENTS,
  access: {
    read: isSignedIn,
    create: isSignedIn,
    // An upload row carries no owner to scope against, so replacing or removing
    // a file someone else uploaded stays with admins. Members drop an unwanted
    // file by unlinking it from their resource and uploading another.
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [],
  upload: {
    // Excludes text/html and image/svg+xml deliberately - both can carry an
    // embedded <script> and are served from our own origin.
    mimeTypes: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/plain",
      "text/csv",
    ],
  },
}
