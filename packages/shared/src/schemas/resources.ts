import { z } from "zod"
import {
  RESOURCE_ATTACHMENT_MIME_TYPES,
  RESOURCE_ATTACHMENTS_MAX_BYTES,
  RESOURCE_ATTACHMENTS_MAX_FILES,
  RESOURCE_ATTACHMENTS_MAX_MB,
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

type AttachmentLike = { name: string; size: number; type: string }

/**
 * The first problem with a set of attachments, or `undefined` when they can all be uploaded.
 * Shared so the form can say so before sending and the action can refuse what slips past it.
 * `linkedCount` is the files a resource already has, which count toward the file cap but not
 * the byte cap, as only new files travel in the request.
 */
export const resourceAttachmentsError = (files: readonly AttachmentLike[], linkedCount = 0) => {
  if (linkedCount + files.length > RESOURCE_ATTACHMENTS_MAX_FILES) {
    return `Attach at most ${RESOURCE_ATTACHMENTS_MAX_FILES} files.`
  }
  const empty = files.find((file) => file.size === 0)
  if (empty) {
    return `${empty.name} is empty. Remove it or attach the file again.`
  }
  const unsupported = files.find(
    (file) => !(RESOURCE_ATTACHMENT_MIME_TYPES as readonly string[]).includes(file.type),
  )
  if (unsupported) {
    return `${unsupported.name} isn't a supported file type. Attach PDF, Word, PowerPoint, Excel, text or CSV files.`
  }
  const totalBytes = files.reduce((total, file) => total + file.size, 0)
  if (totalBytes > RESOURCE_ATTACHMENTS_MAX_BYTES) {
    return `Attachments must be ${RESOURCE_ATTACHMENTS_MAX_MB} MB or smaller in total.`
  }
  return undefined
}

/**
 * A resource's attachments while editing: the saved files still linked, by id, and new files
 * to upload. The ids come from the browser, so updateResource keeps only those already linked.
 */
export const resourceAttachmentsEditSchema = z
  .object({
    keep: z.array(z.number().int().positive()),
    add: z.array(z.instanceof(File)),
  })
  .superRefine(({ add, keep }, ctx) => {
    const message = resourceAttachmentsError(add, keep.length)
    if (message) ctx.addIssue({ code: "custom", message })
  })

// Editing in place: any field may be left out to keep it as is.
export const updateResourceSchema = addResourceFormSchema
  .partial()
  .extend({ attachments: resourceAttachmentsEditSchema.optional() })
