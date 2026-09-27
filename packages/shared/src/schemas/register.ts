import { z } from "zod"
import { MemberTitle } from "../enums/members"
import { isHttpUrl } from "../utils/is-http-url"

/**
 * Shared by the client form and the server action, so a field can never be
 * validated one way in the browser and another way on the server.
 */

export const PASSWORD_MIN_LENGTH = 8

// Also the Members collection's maxLength, so the admin panel enforces the same limit.
export const POSITION_MAX_LENGTH = 100

// Matches Media's own mimeTypes restriction. Excludes image/svg+xml
// deliberately - an SVG can carry an embedded <script>.
export const ALLOWED_AVATAR_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]

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

const splitResearchInterests = (value: string) =>
  value
    .split(",")
    .map((interest) => interest.trim())
    .filter(Boolean)

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
      if (interests.length > 10) {
        ctx.addIssue({ code: "custom", message: "Add up to 10 research interests" })
      }
      if (interests.some((interest) => interest.length > 50)) {
        ctx.addIssue({ code: "custom", message: "Keep each research interest under 50 characters" })
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
          .max(50, "Keep the label under 50 characters"),
        url: z
          .string()
          .trim()
          .refine(isHttpUrl, "Enter a full web address starting with http:// or https://"),
      }),
    )
    .max(5, "Add up to 5 links"),
})

export type RegisterProfile = z.infer<typeof registerProfileSchema>
