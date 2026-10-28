import { z } from "zod"
import { MemberTitle } from "../enums/members"
import { normaliseInterests } from "../utils/interests"
import { isHttpUrl } from "../utils/is-http-url"

/**
 * Shared by the client form and the server action, so a field can never be
 * validated one way in the browser and another way on the server.
 */

export const PASSWORD_MIN_LENGTH = 8

// These limits are also set on the Members collection, so the admin panel
// can't save a value that later fails this schema.
export const POSITION_MAX_LENGTH = 100
export const RESEARCH_INTERESTS_MAX = 10
export const RESEARCH_INTEREST_MAX_LENGTH = 50
export const LINKS_MAX = 5
export const LINK_LABEL_MAX_LENGTH = 50

// Matches Media's own mimeTypes restriction. Excludes image/svg+xml
// deliberately - an SVG can carry an embedded <script>.
export const ALLOWED_AVATAR_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]

// Kept below next.config.ts's serverActions.bodySizeLimit so the photo and the rest of
// the form fit in one request - an oversized body is rejected before the action runs,
// so the client checks this too to give a clear message.
export const MAX_AVATAR_BYTES = 4 * 1024 * 1024

export const VERIFICATION_CODE_LENGTH = 6
export const VERIFICATION_CODE_TTL_MINUTES = 15
export const VERIFICATION_CODE_MAX_ATTEMPTS = 5
export const VERIFICATION_CODE_RESEND_SECONDS = 60
export const VERIFICATION_CODE_MAX_SENDS = 5
export const VERIFICATION_CODE_SEND_WINDOW_MINUTES = 60

export const verificationCodeSchema = z
  .string()
  .trim()
  .regex(
    new RegExp(`^\\d{${VERIFICATION_CODE_LENGTH}}$`),
    `Enter the ${VERIFICATION_CODE_LENGTH}-digit code from the email`,
  )

export const registerDetailsSchema = z.object({
  title: z.enum(MemberTitle).nullable(),
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Surname is required"),
  // The combobox holds the institution id as a string; the action parses it once
  // it has been validated as present.
  institution: z.string().min(1, "Select your university or institution"),
  position: z
    .string()
    .trim()
    .min(1, "Position is required")
    .max(POSITION_MAX_LENGTH, `Keep your position under ${POSITION_MAX_LENGTH} characters`),
  email: z.email("Enter a valid email address"),
  password: z
    .string()
    .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`),
  agreedToTerms: z
    .boolean()
    .refine((agreed) => agreed, "Accept the community guidelines and privacy policy to continue"),
})

export type RegisterDetails = z.infer<typeof registerDetailsSchema>

/** Step one's final submit: the details again, plus the code that proves the email. */
export const registerWithCodeSchema = registerDetailsSchema.extend({ code: verificationCodeSchema })

export type RegisterWithCode = z.infer<typeof registerWithCodeSchema>

// Deduplicated because each interest is also its React key when listed.
const splitResearchInterests = (value: string) => normaliseInterests(value.split(","))

/**
 * Every profile field is skippable - the Figma frames this step as optional
 * ("You can finish this later from your profile"), so an empty submit is valid.
 * Empty strings rather than optional keys, so the form's initial values and the
 * schema's input type line up.
 */
export const registerProfileSchema = z.object({
  bio: z.string().trim().max(500, "Keep your bio under 500 characters"),
  // Typed as one comma-separated line, stored as a list. Checked before the
  // transform so every issue lands on the input itself - a per-item path like
  // researchInterests[1] matches no form field and would never be shown.
  researchInterests: z
    .string()
    .superRefine((value, ctx) => {
      const interests = splitResearchInterests(value)
      if (interests.length > RESEARCH_INTERESTS_MAX) {
        ctx.addIssue({
          code: "custom",
          message: `Add up to ${RESEARCH_INTERESTS_MAX} research interests`,
        })
      }
      if (interests.some((interest) => interest.length > RESEARCH_INTEREST_MAX_LENGTH)) {
        ctx.addIssue({
          code: "custom",
          message: `Keep each research interest under ${RESEARCH_INTEREST_MAX_LENGTH} characters`,
        })
      }
    })
    .transform(splitResearchInterests),
  links: z
    .array(
      z.object({
        label: z
          .string()
          .trim()
          .min(1, "Add a label")
          .max(LINK_LABEL_MAX_LENGTH, `Keep the label under ${LINK_LABEL_MAX_LENGTH} characters`),
        url: z
          .string()
          .trim()
          .refine(isHttpUrl, "Enter a full web address starting with http:// or https://"),
      }),
    )
    .max(LINKS_MAX, `Add up to ${LINKS_MAX} links`),
})
