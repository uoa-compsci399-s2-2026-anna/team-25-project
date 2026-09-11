/**
 * Seeds a fresh local database with the minimum data needed to use the app:
 * a first admin user. `docker compose down -v` wipes the Postgres volume, so
 * this makes a reset a one-liner instead of clicking through Payload's
 * create-first-user screen every time.
 *
 * Add a block per collection as real collections land, keep it collection-driven.
 */
import { getPayloadClient } from "@/lib/payload/getPayloadClient"
import { Slugs } from "@/lib/payload/slugs"
import "dotenv/config"

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || "admin@example.com"
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || "changeme"
const ADMIN_FIRST_NAME = process.env.SEED_ADMIN_FIRST_NAME || "Admin"
const ADMIN_LAST_NAME = process.env.SEED_ADMIN_LAST_NAME || "User"

// `example.ac.nz` matches the placeholder in the register design, so the
// sign-up form can be walked end to end against a freshly seeded database.
const INSTITUTIONS = [
  { country: "NZ" as const, domains: [{ domain: "example.ac.nz" }], name: "University of Example" },
  {
    country: "NZ" as const,
    domains: [{ domain: "auckland.ac.nz" }],
    name: "University of Auckland",
  },
  {
    country: "AU" as const,
    domains: [{ domain: "unimelb.edu.au" }],
    name: "University of Melbourne",
  },
]

const seed = async () => {
  // Schema is managed via migrations (push: false); this just opens a connection.
  const payload = await getPayloadClient()

  // admins
  const existing = await payload.find({
    collection: Slugs.Collections.ADMIN,
    where: { email: { equals: ADMIN_EMAIL } },
    limit: 1,
  })
  if (existing.docs.length > 0) {
    payload.logger.info(`Admin ${ADMIN_EMAIL} already exists, skipping.`)
  } else {
    await payload.create({
      collection: Slugs.Collections.ADMIN,
      data: {
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        firstName: ADMIN_FIRST_NAME,
        lastName: ADMIN_LAST_NAME,
      },
    })
    payload.logger.info(`Created admin ${ADMIN_EMAIL}.`)
  }

  // institutions - registration cannot be exercised at all without at least one,
  // since the sign-up form's dropdown is sourced from this collection and the
  // email domain is checked against it.
  for (const institution of INSTITUTIONS) {
    const existingInstitution = await payload.find({
      collection: Slugs.Collections.INSTITUTIONS,
      where: { name: { equals: institution.name } },
      limit: 1,
    })
    if (existingInstitution.docs.length > 0) {
      payload.logger.info(`Institution ${institution.name} already exists, skipping.`)
      continue
    }
    await payload.create({ collection: Slugs.Collections.INSTITUTIONS, data: institution })
    payload.logger.info(`Created institution ${institution.name}.`)
  }
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Seed failed:", error)
    process.exit(1)
  })
