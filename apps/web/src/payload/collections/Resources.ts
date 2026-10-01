import type { CollectionConfig } from "payload"
import { Slugs } from "@/lib/payload/slugs"
import { isAdmin, isSignedIn } from "../access"
import { admin } from "../access/helpers"
import { isAdminOrOwner } from "../access/Resources"
import {
  defaultResourceOwner,
  revalidateDeletedResource,
  revalidateResources,
} from "../hooks/Resources"

export const Resources: CollectionConfig = {
  slug: Slugs.Collections.RESOURCES,
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "owner", "course", "createdAt"],
  },
  access: {
    read: isSignedIn,
    create: isSignedIn,
    update: isAdminOrOwner,
    delete: isAdmin,
  },
  hooks: {
    afterChange: [revalidateResources],
    afterDelete: [revalidateDeletedResource],
  },
  fields: [
    {
      name: "owner",
      type: "relationship",
      relationTo: Slugs.Collections.MEMBERS,
      required: true,
      // Transfers stay with admins, as on courses: handing a resource to
      // someone else would otherwise lock its owner out of their own upload.
      access: { update: ({ req }) => admin(req) },
      hooks: {
        beforeChange: [defaultResourceOwner],
      },
    },
    {
      name: "title",
      type: "text",
      required: true,
    },
    {
      name: "description",
      type: "richText",
      required: true,
    },
    {
      name: "course",
      type: "relationship",
      relationTo: Slugs.Collections.COURSES,
      admin: {
        description: "Optional. Links the resource to the course it was written for.",
      },
    },
    {
      name: "attachments",
      type: "upload",
      relationTo: Slugs.Collections.RESOURCE_ATTACHMENTS,
      hasMany: true,
      admin: {
        description: "PDFs, slides, documents and spreadsheets for members to download.",
      },
    },
  ],
}
