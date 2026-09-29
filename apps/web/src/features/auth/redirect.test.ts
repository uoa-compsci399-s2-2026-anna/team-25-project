import { describe, expect, it } from "vitest"
import { Routes } from "@/lib/routes"
import { redirectTarget, safeRedirect, withRedirect } from "./redirect"

describe("safeRedirect", () => {
  it.each(["/proposals", "/members/12", "/proposals?q=ai&page=2"])("accepts %s", (value) => {
    expect(safeRedirect(value)).toBe(value)
  })

  it.each([
    undefined,
    null,
    "",
    "proposals",
    "//evil.com",
    "/\\evil.com",
    "/.//evil.com",
    "/a/..//evil.com",
    "/%2e//evil.com",
    "https://evil.com",
    "javascript:alert(1)",
  ])("rejects %j, which is not an in-app path", (value) => {
    expect(safeRedirect(value)).toBeNull()
  })

  it.each([Routes.LOGIN, Routes.REGISTER.ROOT, Routes.REGISTER.PROFILE, "/login?redirect=/login"])(
    "rejects auth page %s to avoid a loop",
    (value) => {
      expect(safeRedirect(value)).toBeNull()
    },
  )
})

describe("redirectTarget", () => {
  it("falls back to home for an unsafe value", () => {
    expect(redirectTarget("//evil.com")).toBe(Routes.HOME)
  })

  it("keeps a safe value", () => {
    expect(redirectTarget("/courses")).toBe("/courses")
  })
})

describe("withRedirect", () => {
  it("encodes the target, including its own query", () => {
    expect(withRedirect(Routes.LOGIN, "/proposals?q=ai")).toBe(
      "/login?redirect=%2Fproposals%3Fq%3Dai",
    )
  })

  it.each([undefined, Routes.HOME, "//evil.com", Routes.LOGIN])(
    "leaves the auth route bare for %j",
    (target) => {
      expect(withRedirect(Routes.REGISTER.ROOT, target)).toBe(Routes.REGISTER.ROOT)
    },
  )
})
