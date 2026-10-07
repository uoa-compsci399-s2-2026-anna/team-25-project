import { RESOURCE_ATTACHMENT_MIME_TYPES } from "@repo/shared/constants/resource-attachments"
import type { CollectionConfig } from "payload"
import { Slugs } from "@/lib/payload/slugs"
import { isAdmin, isSignedIn } from "../access"
import {
  revalidateAttachmentResources,
  revalidateDeletedAttachmentResources,
} from "../hooks/Resources"

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
  hooks: {
    afterChange: [revalidateAttachmentResources],
    afterDelete: [revalidateDeletedAttachmentResources],
  },
  fields: [],
  upload: {
    mimeTypes: [...RESOURCE_ATTACHMENT_MIME_TYPES],
  },
}
