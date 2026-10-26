import { sql } from "@payloadcms/db-postgres"
import { getDbInstance, tableName } from "@/lib/payload/db"
import { getPayloadClient } from "@/lib/payload/getPayloadClient"
import { Slugs } from "@/lib/payload/slugs"

const COLLECTION = Slugs.Collections.RATE_LIMITS

export type RateLimitOptions = {
  /** Minimum gap between two sends for the same key. */
  cooldownSeconds: number
  /** Sends allowed per window. */
  max: number
  windowMinutes: number
}

export type RateLimitResult = { ok: true } | { ok: false; retryAfterSeconds: number }

/**
 * Counts a send against `key` if its limits allow one: no send within the
 * cooldown, and fewer than `max` in the current window. Callers check this
 * before doing the work, since anyone can reach it through a server action.
 *
 * The limits are checked and the send counted in a single upsert, timed by
 * the database clock, so simultaneous requests can't each pass the check.
 *
 * `key` is used exactly as given, so callers must normalise it first (e.g. a
 * trimmed, lowercased email) - otherwise `A@x.com` and `a@x.com` each get
 * their own limit.
 */
export const takeRateLimit = async (
  key: string,
  { cooldownSeconds, max, windowMinutes }: RateLimitOptions,
): Promise<RateLimitResult> => {
  const payload = await getPayloadClient()
  const db = getDbInstance(payload)
  const table = sql.identifier(tableName({ payload }, COLLECTION))

  const cooldown = sql`make_interval(secs => ${cooldownSeconds})`
  const window = sql`make_interval(mins => ${windowMinutes})`

  // A row past its expiry no longer limits anything, whichever key it is for.
  await db.execute(sql`DELETE FROM ${table} WHERE expires_at < now()`)

  const windowOver = sql`${table}.window_started_at <= now() - ${window}`
  const windowStart = sql`CASE WHEN ${windowOver} THEN now() ELSE ${table}.window_started_at END`
  const { rows } = await db.execute<{ id: number }>(sql`
    INSERT INTO ${table}
      ("key", sent_at, count_in_window, window_started_at, expires_at)
    VALUES
      (${key}, now(), 1, now(), now() + GREATEST(${cooldown}, ${window}))
    ON CONFLICT ("key") DO UPDATE SET
      sent_at = now(),
      count_in_window = CASE WHEN ${windowOver} THEN 1 ELSE ${table}.count_in_window + 1 END,
      window_started_at = ${windowStart},
      expires_at = GREATEST(now() + ${cooldown}, ${windowStart} + ${window}),
      updated_at = now()
    WHERE ${table}.sent_at <= now() - ${cooldown}
      AND (${windowOver} OR ${table}.count_in_window < ${max})
    RETURNING id
  `)

  if (rows.length > 0) return { ok: true }

  // The row was kept, so a limit applies. Report whichever lifts last.
  const { rows: waits } = await db.execute<{ retry_after: number | string }>(sql`
    SELECT GREATEST(
      extract(epoch FROM sent_at + ${cooldown} - now()),
      CASE WHEN count_in_window >= ${max}
        THEN extract(epoch FROM window_started_at + ${window} - now())
        ELSE 0 END
    ) AS retry_after
    FROM ${table}
    WHERE "key" = ${key}
  `)
  return {
    ok: false,
    retryAfterSeconds: Math.max(1, Math.ceil(Number(waits[0]?.retry_after ?? 1))),
  }
}

/**
 * Forgets `key`'s sends, for when the work they paid for failed - otherwise
 * the cooldown would stop the member retrying something that never happened.
 * Like the sign-up code's cleanup, this clears the whole window, not one send.
 */
export const releaseRateLimit = async (key: string) => {
  const payload = await getPayloadClient()
  await payload.delete({ collection: COLLECTION, where: { key: { equals: key } } })
}
