import { notFound } from "next/navigation"
import { describe, expect, it, vi } from "vitest"
import { parseMemberId } from "./members.params"

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND")
  }),
}))

describe("parseMemberId", () => {
  it("returns the numeric id", async () => {
    await expect(parseMemberId(Promise.resolve({ memberId: "7" }))).resolves.toBe(7)
  })

  it.each(["0", "-1", "1.5", "abc"])("404s on %j", async (memberId) => {
    await expect(parseMemberId(Promise.resolve({ memberId }))).rejects.toThrow("NEXT_NOT_FOUND")
    expect(notFound).toHaveBeenCalled()
  })
})
