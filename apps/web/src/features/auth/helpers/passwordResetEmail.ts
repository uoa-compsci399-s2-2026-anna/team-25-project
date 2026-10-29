import type { Payload } from "payload"
import { Routes } from "@/lib/routes"
import { siteUrl } from "@/lib/siteUrl"

/**
 * The link always points at the public site rather than whatever host the
 * request came in on, so a spoofed Host header can't send the token elsewhere.
 */
export const resetLink = (token: string) => {
  const url = new URL(Routes.PASSWORD.RESET, siteUrl)
  url.searchParams.set("token", token)
  return url.toString()
}

export const sendResetEmail = (payload: Payload, to: string, link: string) =>
  payload.sendEmail({
    to,
    subject: "Reset your CCCA password",
    text: `Someone asked to reset the password for your CCCA account.\n\nSet a new one here: ${link}\n\nThe link works once and expires in 1 hour. If you didn't ask for this, you can ignore this email - your password won't change.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; padding: 24px;">
        <h2 style="margin: 0 0 16px;">Reset your password</h2>
        <p style="margin: 0 0 24px; line-height: 1.5;">Someone asked to reset the password for your CCCA account. The link works once and expires in 1 hour.</p>
        <p style="margin: 0 0 24px;"><a href="${link}" style="display: inline-block; padding: 12px 20px; background: #c08497; color: #ffffff; text-decoration: none; border-radius: 999px;">Set a new password</a></p>
        <p style="margin: 0 0 8px; font-size: 13px; line-height: 1.5;">Or paste this into your browser:<br />${link}</p>
        <p style="margin: 0; font-size: 13px; line-height: 1.5;">If you didn't ask for this, you can ignore this email - your password won't change.</p>
      </div>
    `,
  })
