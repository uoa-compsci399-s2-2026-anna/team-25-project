import { z } from "zod"

/**
 * Shared by the client form and the server action, so a field can never be
 * validated one way in the browser and another way on the server.
 */

export const PASSWORD_MIN_LENGTH = 8

export const registerDetailsSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Surname is required"),
  // The combobox holds the institution id as a string; the action parses it once
  // it has been validated as present.
  institution: z.string().min(1, "Select your university or institution"),
  email: z.email("Enter a valid email address"),
  password: z
    .string()
    .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`),
  agreedToTerms: z
    .boolean()
    .refine((agreed) => agreed, "Accept the community guidelines and privacy policy to continue"),
})

export type RegisterDetails = z.infer<typeof registerDetailsSchema>

/**
 * Every profile field is skippable - the Figma frames this step as optional
 * ("You can finish this later from your profile"), so an empty submit is valid.
 * Empty strings rather than optional keys, so the form's initial values and the
 * schema's input type line up.
 */
export const registerProfileSchema = z.object({
  position: z.string().trim().max(100, "Keep your position under 100 characters"),
  bio: z.string().trim().max(500, "Keep your bio under 500 characters"),
})

export type RegisterProfile = z.infer<typeof registerProfileSchema>
