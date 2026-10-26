import { z } from "zod"
import { registerDetailsSchema } from "./register"

/** The new password follows sign-up's rules, so a reset can't set one sign-up would refuse. */
export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: registerDetailsSchema.shape.password,
})

export type ResetPassword = z.infer<typeof resetPasswordSchema>
