import type { CollectionConfig } from "payload"
import { Slugs } from "@/lib/payload/slugs"
import { isAdmin } from "../access"

export const Institutions: CollectionConfig = {
  slug: Slugs.Collections.INSTITUTIONS,
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "country"],
  },
  access: {
    read: () => true, // registration dropdown needs this before anyone is logged in
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    { name: "name", type: "text", required: true, unique: true }, // this is what the dropdown will show
    {
      name: "country",
      type: "select",
      required: true,
      options: ["AU", "NZ"],
    },
    {
      name: "domains",
      type: "array",
      required: true,
      minRows: 1,
      admin: {
        description: "e.g. auckland.ac.nz — subdomains are accepted automatically",
      },
      fields: [{ name: "domain", type: "text", required: true }],
    },
  ],
}
