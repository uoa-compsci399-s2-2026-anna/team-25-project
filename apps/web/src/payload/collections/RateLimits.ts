import type { CollectionConfig } from "payload"
import { Slugs } from "@/lib/payload/slugs"

/**
 * Send counters for actions anyone can trigger, such as emailing a reset link,
 * one row per key (e.g. `reset:<email>`). Written and read only by the server
 * through `rateLimit.ts`; every access rule is closed so the REST API can't
 * list or reset them.
 */
export const RateLimits: CollectionConfig = {
  slug: Slugs.Collections.RATE_LIMITS,
  admin: {
    hidden: true,
  },
  access: {
    read: () => false,
    create: () => false,
    update: () => false,
    delete: () => false,
  },
  fields: [
    // Unique so simultaneous requests share one counter instead of each starting their own.
    { name: "key", type: "text", required: true, unique: true },
    { name: "sentAt", type: "date", required: true },
    { name: "countInWindow", type: "number", required: true, defaultValue: 0 },
    { name: "windowStartedAt", type: "date", required: true },
    // When the row stops limiting anything. Stored rather than derived because
    // keys can use different limits, and cleanup runs across all of them.
    { name: "expiresAt", type: "date", required: true, index: true },
  ],
}
