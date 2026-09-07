import type { PostgresAdapter } from "@payloadcms/db-postgres"
import { snakeCase } from "@repo/shared/utils/snake-case"
import { APIError, type PayloadRequest } from "payload"
import type { CollectionSlug } from "./slugs"

// Payload does not expose the transaction handle or the table map on its public database interface.
// Both are reached here and nowhere else, so an upgrade that moves them
// fails to compile in one module instead of at runtime in a hook.
const adapter = (req: PayloadRequest) => req.payload.db as unknown as PostgresAdapter

/**
 * Resolves the physical table for a collection through the adapter's own map.
 * A miss throws rather than falling back to the derived name, so a lock
 * can never be taken against a table that does not exist or, against the wrong one.
 *
 * @param req - The Payload request object.
 * @param collection - The collection slug.
 * @returns The table name Payload writes the collection to.
 */
export function tableName(req: PayloadRequest, collection: CollectionSlug): string {
  const resolved = adapter(req).tableNameMap.get(snakeCase(collection))
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

  const db = adapter(req).sessions[String(transactionID)]?.db
  if (!db) throw new APIError("The database transaction is unavailable.", 500)
  return db
}
