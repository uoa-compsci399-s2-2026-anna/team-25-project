import { createHmac, randomInt, timingSafeEqual } from "node:crypto"
import { sql } from "@payloadcms/db-postgres"
import {
  VERIFICATION_CODE_LENGTH,
  VERIFICATION_CODE_MAX_ATTEMPTS,
  VERIFICATION_CODE_MAX_SENDS,
  VERIFICATION_CODE_RESEND_SECONDS,
  VERIFICATION_CODE_SEND_WINDOW_MINUTES,
  VERIFICATION_CODE_TTL_MINUTES,
} from "@repo/shared/schemas/register"
import type { Payload } from "payload"
import { getDbInstance, tableName } from "@/lib/payload/db"
import { getPayloadClient } from "@/lib/payload/getPayloadClient"
import { Slugs } from "@/lib/payload/slugs"

const COLLECTION = Slugs.Collections.EMAIL_VERIFICATION_CODES

export type IssueCodeResult =
  | { ok: true }
  | { ok: false; error: "cooldown"; retryAfterSeconds: number }
  | { ok: false; error: "send-failed" }

/** "expired" and "locked" are kept apart from "invalid" so the form can offer a new code. */
export type CheckCodeResult = "ok" | "invalid" | "expired" | "locked"

// Matches how Payload stores auth emails, so a code always lines up with the member it creates.
const normaliseEmail = (email: string) => email.trim().toLowerCase()

/**
 * Six digits are easy to brute-force from a bare hash, so the hash is keyed
 * with the server secret. The prefix stops it doubling as any other signature
 * made with that secret, and the email ties the code to one address.
 */
const hashCode = (email: string, code: string) => {
  // Read per call so the secret isn't needed at build time.
  const secret = process.env.PAYLOAD_SECRET
  if (!secret) throw new Error("PAYLOAD_SECRET is not set")
  return createHmac("sha256", secret).update(`email-verification:${email}:${code}`).digest("hex")
}

const hashesMatch = (a: string, b: string) => {
  const left = Buffer.from(a, "hex")
  const right = Buffer.from(b, "hex")
  return left.length === right.length && timingSafeEqual(left, right)
}

const generateCode = () =>
  randomInt(0, 10 ** VERIFICATION_CODE_LENGTH)
    .toString()
    .padStart(VERIFICATION_CODE_LENGTH, "0")

const sendCodeEmail = (payload: Payload, to: string, code: string) =>
  payload.sendEmail({
    to,
    // In the subject so it shows in phone notifications, and in the console
    // fallback's log line when SES isn't configured.
    subject: `${code} is your CCCA verification code`,
    text: `Your CCCA verification code is ${code}.\n\nIt expires in ${VERIFICATION_CODE_TTL_MINUTES} minutes. If you didn't try to sign up, you can ignore this email.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; padding: 24px;">
        <h2 style="margin: 0 0 16px;">Verify your email</h2>
        <p style="margin: 0 0 24px; line-height: 1.5;">Enter this code to finish signing up. It expires in ${VERIFICATION_CODE_TTL_MINUTES} minutes.</p>
        <p style="margin: 0 0 24px; font-size: 32px; font-weight: bold; letter-spacing: 0.3em;">${code}</p>
        <p style="margin: 0; font-size: 13px; line-height: 1.5;">If you didn't try to sign up, you can ignore this email.</p>
      </div>
    `,
  })

/**
 * Replaces the code for this email with a new one and emails it. Anyone can
 * reach this through a server action, so the limits are enforced here rather
 * than trusted to the form: one send per cooldown, and a cap per window, which
 * also caps guesses since each new code gets fresh attempts.
 *
 * The limits are checked and the code written in a single upsert, timed by the
 * database clock, so simultaneous requests can't each pass the check.
 */
export const issueCode = async (rawEmail: string): Promise<IssueCodeResult> => {
  const email = normaliseEmail(rawEmail)
  const payload = await getPayloadClient()
  const db = getDbInstance(payload)
  const table = sql.identifier(tableName({ payload }, COLLECTION))
  const code = generateCode()

  // A finished window means nothing left in the row is still enforcing a limit.
  await db.execute(sql`
    DELETE FROM ${table}
    WHERE expires_at < now()
      AND window_started_at <= now() - make_interval(mins => ${VERIFICATION_CODE_SEND_WINDOW_MINUTES})
  `)

  const windowOver = sql`${table}.window_started_at <= now() - make_interval(mins => ${VERIFICATION_CODE_SEND_WINDOW_MINUTES})`
  const { rows } = await db.execute<{ id: number }>(sql`
    INSERT INTO ${table}
      (email, code_hash, sent_at, expires_at, attempts, sends_in_window, window_started_at)
    VALUES
      (${email}, ${hashCode(email, code)}, now(),
       now() + make_interval(mins => ${VERIFICATION_CODE_TTL_MINUTES}), 0, 1, now())
    ON CONFLICT (email) DO UPDATE SET
      code_hash = excluded.code_hash,
      sent_at = excluded.sent_at,
      expires_at = excluded.expires_at,
      attempts = 0,
      sends_in_window = CASE WHEN ${windowOver} THEN 1 ELSE ${table}.sends_in_window + 1 END,
      window_started_at = CASE WHEN ${windowOver} THEN now() ELSE ${table}.window_started_at END,
      updated_at = now()
    WHERE ${table}.sent_at <= now() - make_interval(secs => ${VERIFICATION_CODE_RESEND_SECONDS})
      AND (${windowOver} OR ${table}.sends_in_window < ${VERIFICATION_CODE_MAX_SENDS})
    RETURNING id
  `)

  const [issued] = rows
  if (!issued) {
    // The row was kept, so a limit applies. Report whichever lifts last.
    const { rows: waits } = await db.execute<{ retry_after: number | string }>(sql`
      SELECT GREATEST(
        extract(epoch FROM sent_at + make_interval(secs => ${VERIFICATION_CODE_RESEND_SECONDS}) - now()),
        CASE WHEN sends_in_window >= ${VERIFICATION_CODE_MAX_SENDS}
          THEN extract(epoch FROM window_started_at + make_interval(mins => ${VERIFICATION_CODE_SEND_WINDOW_MINUTES}) - now())
          ELSE 0 END
      ) AS retry_after
      FROM ${table}
      WHERE email = ${email}
    `)
    return {
      ok: false,
      error: "cooldown",
      retryAfterSeconds: Math.max(1, Math.ceil(Number(waits[0]?.retry_after ?? 1))),
    }
  }

  try {
    await sendCodeEmail(payload, email, code)
  } catch (error) {
    // Without this, the member would be told to check an inbox that never gets
    // a code, and the cooldown would stop them asking for another.
    payload.logger.error({ err: error }, "verification code email failed")
    await payload.delete({ collection: COLLECTION, id: issued.id })
    return { ok: false, error: "send-failed" }
  }

  return { ok: true }
}

/**
 * Counts the guess and checks the limit in one UPDATE. A separate read and
 * write would let simultaneous guesses all see the same count and slip past
 * the limit.
 */
export const checkCode = async (rawEmail: string, code: string): Promise<CheckCodeResult> => {
  const email = normaliseEmail(rawEmail)
  const payload = await getPayloadClient()
  const db = getDbInstance(payload)
  const table = sql.identifier(tableName({ payload }, COLLECTION))

  const { rows } = await db.execute<{ code_hash: string }>(sql`
    UPDATE ${table}
    SET attempts = attempts + 1, updated_at = now()
    WHERE email = ${email}
      AND expires_at > now()
      AND attempts < ${VERIFICATION_CODE_MAX_ATTEMPTS}
    RETURNING code_hash
  `)

  const [counted] = rows
  if (counted) return hashesMatch(hashCode(email, code), counted.code_hash) ? "ok" : "invalid"

  // Nothing was counted: the code has either run out of tries or out of time.
  const { rows: live } = await db.execute(sql`
    SELECT 1 FROM ${table} WHERE email = ${email} AND expires_at > now()
  `)
  return live.length > 0 ? "locked" : "expired"
}

/** Called only once the account exists, so a failed create doesn't use up the code. */
export const consumeCode = async (rawEmail: string) => {
  const payload = await getPayloadClient()
  await payload.delete({
    collection: COLLECTION,
    where: { email: { equals: normaliseEmail(rawEmail) } },
  })
}
