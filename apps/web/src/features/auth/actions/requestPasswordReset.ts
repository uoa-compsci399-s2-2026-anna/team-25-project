"use server"

import {
  type ForgotPassword,
  forgotPasswordSchema,
  RESET_EMAIL_MAX_SENDS,
  RESET_EMAIL_RESEND_SECONDS,
  RESET_EMAIL_SEND_WINDOW_MINUTES,
} from "@repo/shared/schemas/passwordReset"
import { getPayloadClient } from "@/lib/payload/getPayloadClient"
import { Slugs } from "@/lib/payload/slugs"
import { resetLink, sendResetEmail } from "../helpers/passwordResetEmail"
import { releaseRateLimit, takeRateLimit } from "../helpers/rateLimit"
import type { SendCodeResult } from "./types"

const SEND_FAILED = "We couldn't send the email right now. Try again."

const formatWait = (seconds: number) =>
  seconds < 60
    ? `${seconds} second${seconds === 1 ? "" : "s"}`
    : `${Math.ceil(seconds / 60)} minute${Math.ceil(seconds / 60) === 1 ? "" : "s"}`

/**
 * Emails a reset link if the address belongs to a member. The answer is the
 * same either way, and the send limit is counted whether or not an account
 * exists - a wait shown only for real accounts would reveal which ones are.
 */
export const requestPasswordReset = async (input: ForgotPassword): Promise<SendCodeResult> => {
  const parsed = forgotPasswordSchema.safeParse(input)
  if (!parsed.success) {
    return { fieldErrors: { email: parsed.error.issues[0]?.message ?? "" }, ok: false }
  }

  // Matches how Payload stores member emails, so A@x and a@x share one limit.
  const email = parsed.data.email.toLowerCase()
  const limitKey = `reset:${email}`
  const payload = await getPayloadClient()

  // Without SES, Payload logs only the recipient and subject, so the link
  // would never reach anyone. Fine locally; in production it's a dead end.
  if (process.env.NODE_ENV === "production" && payload.email.name === "console") {
    payload.logger.error("requestPasswordReset: no email adapter is configured")
    return { formError: SEND_FAILED, ok: false }
  }

  try {
    const limit = await takeRateLimit(limitKey, {
      cooldownSeconds: RESET_EMAIL_RESEND_SECONDS,
      max: RESET_EMAIL_MAX_SENDS,
      windowMinutes: RESET_EMAIL_SEND_WINDOW_MINUTES,
    })
    if (!limit.ok) {
      return {
        formError: `You can ask for another email in ${formatWait(limit.retryAfterSeconds)}.`,
        ok: false,
        retryAfterSeconds: limit.retryAfterSeconds,
      }
    }

    // Creates and stores the token, or returns null for an unknown address.
    // Payload's own email is off so ours can carry a plain-text part too.
    const token = await payload.forgotPassword({
      collection: Slugs.Collections.MEMBERS,
      data: { email },
      disableEmail: true,
    })
    if (token) await sendResetEmail(payload, email, resetLink(token))
  } catch (error) {
    // Without this, the member would be told to check an inbox that never
    // gets the email, and the limit would stop them asking for another.
    payload.logger.error({ err: error }, "requestPasswordReset failed")
    await releaseRateLimit(limitKey).catch(() => {})
    return { formError: SEND_FAILED, ok: false }
  }

  return { ok: true }
}
