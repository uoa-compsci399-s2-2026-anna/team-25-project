import { z } from "zod"
import {
  ALLOWED_AVATAR_MIME_TYPES,
  MAX_AVATAR_BYTES,
  RESEARCH_INTEREST_MAX_LENGTH,
  RESEARCH_INTERESTS_MAX,
  registerDetailsSchema,
  registerProfileSchema,
  TEACHING_INTEREST_MAX_LENGTH,
  TEACHING_INTERESTS_MAX,
} from "./register"

// Blanks and repeats are dropped before counting, so "AI, , AI" is one interest.
// Checked on the whole list rather than per item - a per-item path like
// researchInterests[1] matches no form field and would never be shown.
const interestListSchema = ({
  kind,
  max,
  maxLength,
}: {
  kind: string
  max: number
  maxLength: number
}) =>
  z
    .array(z.string().trim())
    .transform((interests) => [...new Set(interests.filter(Boolean))])
    .superRefine((interests, ctx) => {
      if (interests.length > max) {
        ctx.addIssue({ code: "custom", message: `Add up to ${max} ${kind} interests` })
      }
      if (interests.some((interest) => interest.length > maxLength)) {
        ctx.addIssue({
          code: "custom",
          message: `Keep each ${kind} interest under ${maxLength} characters`,
        })
      }
    })

/**
 * Editing a profile after registration - shared by the profile edit form and the
 * server action, and built from the registration schemas so a field can't be
 * valid in one place and not the other.
 *
 * Every key is optional: the form only holds the fields currently on screen.
 */
export const memberProfileSchema = z
  .object({
    ...registerDetailsSchema.pick({ title: true, firstName: true, lastName: true, position: true })
      .shape,
    ...registerProfileSchema.pick({ bio: true, department: true, faculty: true }).shape,
    researchInterests: interestListSchema({
      kind: "research",
      max: RESEARCH_INTERESTS_MAX,
      maxLength: RESEARCH_INTEREST_MAX_LENGTH,
    }),
    teachingInterests: interestListSchema({
      kind: "teaching",
      max: TEACHING_INTERESTS_MAX,
      maxLength: TEACHING_INTEREST_MAX_LENGTH,
    }),
  })
  .partial()

const formatMegabytes = (bytes: number) => `${Math.round(bytes / (1024 * 1024))} MB`

/**
 * Checks a picked profile photo. Shared by the photo picker and the server action,
 * so the browser rejects exactly what the server would. Returns the error message,
 * or undefined when the file is fine.
 */
export const avatarFileError = (
  file: { size: number; type: string },
  {
    accept = ALLOWED_AVATAR_MIME_TYPES,
    maxBytes = MAX_AVATAR_BYTES,
  }: { accept?: readonly string[]; maxBytes?: number } = {},
) => {
  if (!accept.includes(file.type)) return "Choose a JPG, PNG, GIF or WEBP image."
  if (file.size > maxBytes) return `Your photo must be ${formatMegabytes(maxBytes)} or smaller.`
  return undefined
}
