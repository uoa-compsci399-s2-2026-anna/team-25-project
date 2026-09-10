import { sql } from "@payloadcms/db-postgres"
import { APIError, type PayloadRequest } from "payload"
import type { CollectionSlug } from "@/lib/payload/slugs"
import { getTransactionDbInstance, tableName } from "./db"

// Postgres waits for a row lock forever by default. A publication holds this lock
// across a snapshot build and a nested update, so a second writer on the same row
// would block with no error and hold its pool connection until the request died.
// Bounding the wait turns contention into a message the editor can act on.
// SET takes no bind parameters, so the interval is a literal in the statement below.

// Postgres raises lock_not_available when lock_timeout expires.
const LOCK_NOT_AVAILABLE = "55P03"

const isLockTimeout = (error: unknown) =>
  typeof error === "object" &&
  error !== null &&
  (error as { code?: unknown }).code === LOCK_NOT_AVAILABLE

/**
 * Takes a row lock inside the request's transaction and returns the locked
 * document. Concurrent writers on the same row wait until the transaction ends,
 * so a caller can read, validate and write without a lost update.
 *
 * Payload's own `lockDocuments` does not do this. It compares the holder against
 * `req.user` and is skipped entirely unless `overrideLock` is false, so it stops
 * two people editing in the admin panel and nothing else.
 *
 * Throws 400 without an ID, 404 when the row does not exist, and 409 when another
 * writer holds the lock for longer than the timeout.
 */
export async function lockDocument<T>(
  req: PayloadRequest,
  collection: CollectionSlug,
  id: number | undefined,
): Promise<T> {
  if (!id) throw new APIError(`A ${collection} record is required.`, 400)

  const db = await getTransactionDbInstance(req)

  // LOCAL scopes this to the transaction, so it cannot leak to the pooled connection.
  await db.execute(sql`SET LOCAL lock_timeout = '5s'`)

  let lockedRows = 0
  try {
    const locked = await db.execute(
      sql`SELECT id FROM ${sql.identifier(tableName(req, collection))} WHERE id = ${id} FOR UPDATE`,
    )
    lockedRows = locked.rows.length
  } catch (error) {
    // Anything that is not the timeout is a real fault and must keep propagating.
    if (!isLockTimeout(error)) throw error

    req.payload.logger.warn(
      { collection, id, userID: req.user?.id },
      "Timed out waiting for a row lock.",
    )
    throw new APIError(
      `Someone else is saving this ${collection} record. Try again in a moment.`,
      409,
    )
  }

  // A row that does not exist matches nothing and locks nothing. Saying so here
  // keeps the failure at the lock, rather than depending on the read, which can have errors disabled.
  if (lockedRows === 0) throw new APIError(`This ${collection} record was not found.`, 404)

  return req.payload.findByID({
    collection,
    id,
    depth: 0,
    req,
    overrideAccess: true,
  }) as Promise<T>
}
