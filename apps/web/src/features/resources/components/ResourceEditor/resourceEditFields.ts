import type { updateResourceSchema } from "@repo/shared/schemas/resources"
import type { z } from "zod"
import { createEditFields } from "@/components/Editor/createEditFields"

/** Every resource attribute an Edit component can bind to, keyed by form field name. */
export type ResourceValues = z.input<typeof updateResourceSchema>

/** The Edit controls for a resource, e.g. <ResourceEdit.Input name="title" />. */
export const ResourceEdit = createEditFields<ResourceValues>()
