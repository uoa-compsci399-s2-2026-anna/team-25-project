import { describe, expect, it } from "vitest"
import { Media } from "./Media"

const signedOut = { req: {} } as never
const member = { req: { user: { collection: "members" } } } as never
const admin = { req: { user: { collection: "admin" } } } as never

describe("Media collection", () => {
  it("lets anyone view an upload", () => {
    expect(Media.access?.read?.(signedOut)).toBe(true)
  })

  it("lets a member upload but not change or delete an upload", () => {
    expect(Media.access?.create?.(signedOut)).toBe(false)
    expect(Media.access?.create?.(member)).toBe(true)
    expect(Media.access?.update?.(member)).toBe(false)
    expect(Media.access?.delete?.(member)).toBe(false)
  })

  it("lets an admin change and delete an upload", () => {
    expect(Media.access?.update?.(admin)).toBe(true)
    expect(Media.access?.delete?.(admin)).toBe(true)
  })
})
