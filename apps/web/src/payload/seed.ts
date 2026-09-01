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
const ADMIN_FIRST_NAME = process.env.SEED_ADMIN_FIRST_NAME || "Admin"
const ADMIN_LAST_NAME = process.env.SEED_ADMIN_LAST_NAME || "User"

const seed = async () => {
  // Schema is managed via migrations (push: false); this just opens a connection.
  const payload = await getPayload({ config })

  // admins
  const existing = await payload.find({
    collection: "admin",
    where: { email: { equals: ADMIN_EMAIL } },
    limit: 1,
  })
  if (existing.docs.length > 0) {
    payload.logger.info(`Admin ${ADMIN_EMAIL} already exists, skipping.`)
  } else {
    await payload.create({
      collection: "admin",
      data: {
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        firstName: ADMIN_FIRST_NAME,
        lastName: ADMIN_LAST_NAME,
      },
    })
    payload.logger.info(`Created admin ${ADMIN_EMAIL}.`)
  }
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Seed failed:", error)
    process.exit(1)
  })
