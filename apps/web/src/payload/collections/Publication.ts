import { PublicationType, PublicationTypeLabels } from "@repo/shared/enums/publications"
import { toSelectOptions } from "@repo/shared/utils/select-options"
import type { CollectionConfig } from "payload"
import { Slugs } from "@/lib/payload/slugs"
import { isSignedIn } from "../access"
import { isAdminOrLinkedAuthor } from "../access/Publications"
import { requireLinkedAuthor } from "../hooks/Publications"

const DOI_PATTERN = /^10\.\d{4,9}\/\S+$/

export const Publications: CollectionConfig = {
  slug: Slugs.Collections.PUBLICATIONS,
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "type", "year", "doi"],
  },
  hooks: {
    beforeChange: [requireLinkedAuthor],
  },
  access: {
    read: () => true,
    create: isSignedIn,
    update: isAdminOrLinkedAuthor,
    delete: isAdminOrLinkedAuthor,
  },
  fields: [
    {
      name: "citationKey",
      type: "text",
      unique: true,
      admin: { description: "BibTeX key, e.g. smith2024learning" },
    },
    {
      name: "type",
      type: "select",
      required: true,
      defaultValue: PublicationType.ARTICLE,
      options: toSelectOptions(PublicationTypeLabels),
    },
    { name: "title", type: "text", required: true },
    {
      name: "authors",
      type: "array",
      required: true,
      minRows: 1,
      fields: [
        {
          type: "row",
          fields: [
            {
              name: "name",
              type: "text",
              required: true,
              admin: { description: "As printed in the publication" },
            },
            {
              name: "member",
              type: "relationship",
              relationTo: Slugs.Collections.MEMBERS,
              admin: { description: "Optional. Links this author to a member profile" },
            },
          ],
        },
      ],
    },
    {
      type: "row",
      fields: [
        { name: "year", type: "number", required: true, min: 1000, max: 9999 },
        { name: "month", type: "number", min: 1, max: 12 },
      ],
    },
    {
      name: "doi",
      type: "text",
      unique: true,
      admin: { description: "Without the https://doi.org/ prefix, e.g. 10.1145/3313831.3376518" },
      validate: (value: string | null | undefined) =>
        !value || DOI_PATTERN.test(value) || "Enter a DOI that starts with 10.",
    },
    { name: "url", type: "text" },
    {
      name: "venue",
      type: "text",
      admin: { description: "Journal, conference, school, institution or repository, e.g. arXiv" },
    },
    {
      type: "row",
      fields: [
        { name: "volume", type: "text" },
        { name: "issue", type: "text" },
        { name: "pages", type: "text", admin: { description: "e.g. 123-145" } },
      ],
    },
    { name: "publisher", type: "text" },
    { name: "abstract", type: "textarea" },
    {
      name: "tags",
      type: "text",
      hasMany: true,
    },
  ],
}
