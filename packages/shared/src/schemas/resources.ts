import { z } from "zod"
import {
  RESOURCE_ATTACHMENT_MIME_TYPES,
  RESOURCE_ATTACHMENTS_MAX_BYTES,
  RESOURCE_ATTACHMENTS_MAX_FILES,
} from "../constants/resource-attachments"
import { richTextHasText, richTextSchema } from "./shared"

export const addResourceFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(200, "Keep the title under 200 characters"),
  description: richTextSchema.refine(
    (description) => richTextHasText(description.root),
    "Description is required",
  ),
  course: z.number().int().positive().nullable(),
})

export type AddResourceFormInput = z.infer<typeof addResourceFormSchema>

type AttachmentLike = { name: string; size: number; type: string }

/**
 * The first problem with a set of attachments, or `undefined` when they can all be uploaded.
 * Shared so the form can say so before sending and the action can refuse what slips past it.
 */
export const resourceAttachmentsError = (files: readonly AttachmentLike[]) => {
  if (files.length > RESOURCE_ATTACHMENTS_MAX_FILES) {
    return `Attach at most ${RESOURCE_ATTACHMENTS_MAX_FILES} files.`
  }
  const unsupported = files.find(
    (file) => !(RESOURCE_ATTACHMENT_MIME_TYPES as readonly string[]).includes(file.type),
  )
  if (unsupported) {
    return `${unsupported.name} isn't a supported file type. Attach PDF, Word, PowerPoint, Excel, text or CSV files.`
  }
  const totalBytes = files.reduce((total, file) => total + file.size, 0)
  if (totalBytes > RESOURCE_ATTACHMENTS_MAX_BYTES) {
    return "Attachments must be 50 MB or smaller in total."
  }
  return undefined
}
