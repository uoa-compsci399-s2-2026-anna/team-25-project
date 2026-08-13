import { afterAll, beforeAll } from "vitest"
import { getMongoMemoryServer, stopMongoMemoryServer } from "./db.js"

// Payload reads DATABASE_URL (see apps/backend/src/payload.config.ts); point it at the in-memory instance.
beforeAll(async () => {
  const mongod = await getMongoMemoryServer()
  process.env.DATABASE_URL = mongod.getUri()
  process.env.PAYLOAD_SECRET = process.env.PAYLOAD_SECRET || "test-secret"
})

afterAll(async () => {
  await stopMongoMemoryServer()
})
