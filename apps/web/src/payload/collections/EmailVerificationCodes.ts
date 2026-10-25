import type { CollectionConfig } from "payload"
import { Slugs } from "@/lib/payload/slugs"

/**
 * Sign-up codes, written and read only by the server through the local API.
 * Every access rule is closed so the REST API can't list or forge them.
 */
export const EmailVerificationCodes: CollectionConfig = {
  slug: Slugs.Collections.EMAIL_VERIFICATION_CODES,
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
    // Unique so simultaneous requests can't leave several live codes for one
    // address - each guess would then be checked against all of them.
    { name: "email", type: "email", required: true, unique: true },
    { name: "codeHash", type: "text", required: true },
    { name: "sentAt", type: "date", required: true },
    { name: "expiresAt", type: "date", required: true },
    { name: "attempts", type: "number", required: true, defaultValue: 0 },
    // Caps resends per hour; a resend resets `attempts`, so this bounds the guesses too.
    { name: "sendsInWindow", type: "number", required: true, defaultValue: 0 },
    { name: "windowStartedAt", type: "date", required: true },
  ],
}
