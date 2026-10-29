import { z } from "zod"
import { registerDetailsSchema } from "./register"

// Stricter than sign-up's code resends: a reset email is rarer and a better
// target for flooding someone's inbox. Counted per address.
export const RESET_EMAIL_RESEND_SECONDS = 120
export const RESET_EMAIL_MAX_SENDS = 3
export const RESET_EMAIL_SEND_WINDOW_MINUTES = 60

export const forgotPasswordSchema = z.object({
  email: registerDetailsSchema.shape.email,
})

export type ForgotPassword = z.infer<typeof forgotPasswordSchema>

/** The new password follows sign-up's rules, so a reset can't set one sign-up would refuse. */
export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: registerDetailsSchema.shape.password,
})

export type ResetPassword = z.infer<typeof resetPasswordSchema>
