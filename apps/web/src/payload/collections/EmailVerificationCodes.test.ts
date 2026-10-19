import type { Access } from "payload"
import { describe, expect, it } from "vitest"
import { EmailVerificationCodes } from "./EmailVerificationCodes"

const asAdmin = { req: { user: { collection: "admin", id: 1 } } } as Parameters<Access>[0]

describe("EmailVerificationCodes collection", () => {
  it.each(["read", "create", "update", "delete"] as const)(
    "refuses %s through the API, even for an admin",
    (operation) => {
      const rule = EmailVerificationCodes.access?.[operation] as Access
      expect(rule(asAdmin)).toBe(false)
    },
  )

  it("is hidden from the admin panel", () => {
    expect(EmailVerificationCodes.admin?.hidden).toBe(true)
  })
})
