"use server"

import { sql } from "@payloadcms/db-postgres"
import { type ResetPassword, resetPasswordSchema } from "@repo/shared/schemas/passwordReset"
import { APIError, type Payload } from "payload"
import { getDbInstance, tableName } from "@/lib/payload/db"
import { getPayloadClient } from "@/lib/payload/getPayloadClient"
import { Slugs } from "@/lib/payload/slugs"
import { setSessionCookie } from "../helpers/sessionCookie"
import type { ResetPasswordResult } from "./types"

const INVALID_LINK = "This reset link has expired or has already been used."

const invalidLink: ResetPasswordResult = { formError: INVALID_LINK, invalidToken: true, ok: false }

// The token Payload just issued names its session in the `sid` claim. Read
// without verifying, since it came straight from Payload rather than a client.
const sessionIdOf = (token: string): string | undefined => {
  const [, claims] = token.split(".")
  return claims ? JSON.parse(Buffer.from(claims, "base64url").toString()).sid : undefined
}

/**
 * Ends every other session and lifts any lockout, which Payload's reset doesn't.
 * Written straight to the database so the Members hooks can't refuse it.
 */
const secureAccount = async (payload: Payload, memberId: number, token: string) => {
  await payload.db.updateOne({
    collection: Slugs.Collections.MEMBERS,
    data: { lockUntil: null, loginAttempts: 0 },
    id: memberId,
    returning: false,
  })

  // Without it, the delete below would end the new session too.
  const sid = sessionIdOf(token)
  if (!sid) throw new Error("the reset token names no session")

  // A Payload write that includes `sessions` needs the whole member, which
  // could overwrite a profile edit made meanwhile - so the rows go directly.
  const sessions = sql.identifier(tableName({ payload }, Slugs.Collections.MEMBERS, "sessions"))
  await getDbInstance(payload).execute(
    sql`DELETE FROM ${sessions} WHERE _parent_id = ${memberId} AND id <> ${sid}`,
  )
}

/** Sets a new password from an emailed reset link, then signs the member in. */
export const resetPassword = async (input: ResetPassword): Promise<ResetPasswordResult> => {
  const parsed = resetPasswordSchema.safeParse(input)
  if (!parsed.success) {
    const passwordIssue = parsed.error.issues.find(({ path }) => path[0] === "password")
    // Only the password can be fixed by retyping; anything else is a broken link.
    return passwordIssue
      ? { fieldErrors: { password: passwordIssue.message }, ok: false }
      : invalidLink
  }

  const payload = await getPayloadClient()

  let result: Awaited<ReturnType<typeof payload.resetPassword>>
  try {
    result = await payload.resetPassword({
      collection: Slugs.Collections.MEMBERS,
      data: parsed.data,
      overrideAccess: true,
    })
  } catch (error) {
    // Payload answers an unknown or expired token with a 403.
    if (error instanceof APIError && error.status === 403) return invalidLink
    payload.logger.error({ err: error }, "resetPassword failed")
    return { formError: "We couldn't reset your password. Try again.", ok: false }
  }

  const { token, user } = result
  if (!token) {
    return { formError: "Your password was changed. Log in with your new password.", ok: false }
  }

  try {
    await secureAccount(payload, user.id as number, token)
  } catch (error) {
    payload.logger.error({ err: error }, "ending other sessions after a password reset failed")
    return {
      formError:
        "Your password was changed, but we couldn't sign you out on your other devices. Log in with your new password.",
      ok: false,
    }
  }

  try {
    await setSessionCookie(payload, token)
  } catch {
    return { formError: "Your password was changed. Log in with your new password.", ok: false }
  }

  return { ok: true }
}
