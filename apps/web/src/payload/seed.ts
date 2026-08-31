/**
 * Seeds a fresh local database with the minimum data needed to use the app:
 * a first admin user. `docker compose down -v` wipes the Postgres volume, so
 * this makes a reset a one-liner instead of clicking through Payload's
 * create-first-user screen every time.
 *
 * Add a block per collection as real collections land, keep it collection-driven.
 */
import "dotenv/config"
import config from "@payload-config"
import { getPayload } from "payload"

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || "admin@example.com"
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || "changeme"

const seed = async () => {
  // Connecting also runs the adapter's `push`
  const payload = await getPayload({ config })

  // users
  const existing = await payload.find({
    collection: "users",
    where: { email: { equals: ADMIN_EMAIL } },
    limit: 1,
  })
  if (existing.docs.length > 0) {
    payload.logger.info(`Admin user ${ADMIN_EMAIL} already exists, skipping.`)
  } else {
    await payload.create({
      collection: "users",
      data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
    })
    payload.logger.info(`Created admin user ${ADMIN_EMAIL}.`)
  }
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Seed failed:", error)
    process.exit(1)
  })
