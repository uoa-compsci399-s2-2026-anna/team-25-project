import type { PostgresAdapter } from "@payloadcms/db-postgres"
import { snakeCase } from "@repo/shared/utils/snake-case"
import { APIError, type Payload, type PayloadRequest } from "payload"
import type { CollectionSlug } from "./slugs"

// Payload does not expose the transaction handle or the table map on its public database interface.
// Both are reached here and nowhere else, so an upgrade that moves them
// fails to compile in one module instead of at runtime in a hook.
const adapter = (payload: Payload) => payload.db as unknown as PostgresAdapter

/**
 * Resolves the physical table for a collection through the adapter's own map.
 * A miss throws rather than falling back to the derived name, so a lock
 * can never be taken against a table that does not exist or, against the wrong one.
 *
 * @param req - The Payload request object, or anything carrying the Payload instance.
 * @param collection - The collection slug.
 * @returns The table name Payload writes the collection to.
 */
export function tableName(
  req: Pick<PayloadRequest, "payload">,
  collection: CollectionSlug,
): string {
  const resolved = adapter(req.payload).tableNameMap.get(snakeCase(collection))
  if (!resolved) throw new APIError(`No table is mapped for ${collection}.`, 500)
  return resolved
}

/**
 * Returns the Drizzle handle bound to the request's transaction.
 *
 * @param req - The Payload request object.
 * @returns The transaction-bound database handle.
 */
export async function getTransactionDbInstance(req: PayloadRequest) {
  const transactionID = await req.transactionID
  if (!transactionID) throw new APIError("This write requires a database transaction.", 500)

  const db = adapter(req.payload).sessions[String(transactionID)]?.db
  if (!db) throw new APIError("The database transaction is unavailable.", 500)
  return db
}

/**
 * Returns the pool's Drizzle handle, outside any transaction. Only for single
 * statements that are atomic on their own; anything that reads then writes
 * belongs in a transaction via `getTransactionDbInstance`.
 *
 * @param payload - The Payload instance.
 * @returns The adapter's Drizzle handle.
 */
export function getDbInstance(payload: Payload) {
  return adapter(payload).drizzle
}
