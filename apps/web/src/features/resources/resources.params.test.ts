import { notFound } from "next/navigation"
import { describe, expect, it, vi } from "vitest"
import { parseResourceId } from "./resources.params"

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND")
  }),
}))

describe("parseResourceId", () => {
  it("returns the numeric id", async () => {
    await expect(parseResourceId(Promise.resolve({ resourceId: "7" }))).resolves.toBe(7)
  })

  it.each(["0", "-1", "1.5", "abc"])("404s on %j", async (resourceId) => {
    await expect(parseResourceId(Promise.resolve({ resourceId }))).rejects.toThrow("NEXT_NOT_FOUND")
    expect(notFound).toHaveBeenCalled()
  })
})
