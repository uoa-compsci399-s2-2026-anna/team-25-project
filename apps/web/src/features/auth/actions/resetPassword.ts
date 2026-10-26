"use server"

import type { Member } from "@repo/shared/payload-types"
import { type ResetPassword, resetPasswordSchema } from "@repo/shared/schemas/passwordReset"
import { APIError, type Payload } from "payload"
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
 * Ends every session but the one the reset just opened, and lifts any login
 * lockout - a reset is what someone does after their password leaked, or after
 * locking themselves out. Payload's reset does neither.
 *
 * Written straight to the database, as Payload's own session bookkeeping is, so
 * the Members hooks and validation can't refuse it. The whole document goes in:
 * a partial write that includes an array field fails the table's required
 * columns on Postgres.
 */
const secureAccount = async (payload: Payload, member: Member, token: string) => {
  const sid = sessionIdOf(token)
  const sessions = (member.sessions ?? []).filter((session) => session.id === sid)
  const unlock = { lockUntil: null, loginAttempts: 0 }

  // Writing the list without the new session would end that one too, signing
  // the member out straight after the reset - leave the sessions alone instead.
  if (sessions.length === 0) {
    payload.logger.error("password reset: the new session wasn't found, other sessions kept")
    await payload.db.updateOne({
      collection: Slugs.Collections.MEMBERS,
      data: unlock,
      id: member.id,
      returning: false,
    })
    return
  }

  await payload.db.updateOne({
    collection: Slugs.Collections.MEMBERS,
    data: { ...member, ...unlock, sessions },
    id: member.id,
    returning: false,
  })
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
      // Also what lets the returned user include `sessions`, which only the
      // member themselves can otherwise read - `secureAccount` relies on it.
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
    await secureAccount(payload, user as unknown as Member, token)
  } catch (error) {
    // The password has already changed, so the member shouldn't be told the
    // reset failed. Logged so the leftover sessions can be followed up.
    payload.logger.error({ err: error }, "ending other sessions after a password reset failed")
  }

  try {
    await setSessionCookie(payload, token)
  } catch {
    return { formError: "Your password was changed. Log in with your new password.", ok: false }
  }

  return { ok: true }
}
