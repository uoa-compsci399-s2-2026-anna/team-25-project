import type { updateResourceSchema } from "@repo/shared/schemas/resources"
import type { ComponentProps } from "react"
import type { z } from "zod"
import { createEditFields, type TypedEdit } from "@/components/Editor/createEditFields"
import { EditAttachments, type EditAttachmentsValue } from "./EditAttachments"

/** Every resource attribute an Edit component can bind to, keyed by form field name. */
export type ResourceValues = z.input<typeof updateResourceSchema>

const Attachments: TypedEdit<
  ComponentProps<typeof EditAttachments>,
  ResourceValues,
  EditAttachmentsValue
> = EditAttachments

/** The Edit controls for a resource, e.g. <ResourceEdit.Input name="title" />. */
export const ResourceEdit = { ...createEditFields<ResourceValues>(), Attachments }
