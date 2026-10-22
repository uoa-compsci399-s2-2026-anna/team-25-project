import { describe, expect, it } from "vitest"
import { registerProfileSchema, verificationCodeSchema } from "./register"

const profile = (researchInterests: string) => ({ bio: "", links: [], researchInterests })

describe("registerProfileSchema researchInterests", () => {
  it("splits the comma-separated input into trimmed interests", () => {
    const result = registerProfileSchema.parse(profile(" Code review, , Generative AI "))
    expect(result.researchInterests).toEqual(["Code review", "Generative AI"])
  })

  it("drops repeated interests", () => {
    const result = registerProfileSchema.parse(profile("Code review, Generative AI, Code review"))
    expect(result.researchInterests).toEqual(["Code review", "Generative AI"])
  })

  it("counts repeats once towards the limit of 10", () => {
    const interests = Array.from({ length: 10 }, (_, i) => `Interest ${i}`)
    const result = registerProfileSchema.safeParse(profile([...interests, "Interest 0"].join(",")))
    expect(result.success).toBe(true)
  })

  // The form only shows errors on paths that match one of its fields, so a
  // per-item path like researchInterests[1] would never reach the user.
  it.each([
    [
      "an interest over 50 characters",
      `Code review, ${"x".repeat(51)}`,
      "Keep each research interest under 50 characters",
    ],
    [
      "more than 10 interests",
      Array.from({ length: 11 }, (_, i) => `Interest ${i}`).join(","),
      "Add up to 10 research interests",
    ],
  ])("reports %s against the input itself", (_, value, message) => {
    const result = registerProfileSchema.safeParse(profile(value))
    expect(result.error?.issues).toEqual([
      expect.objectContaining({ message, path: ["researchInterests"] }),
    ])
  })
})

describe("verificationCodeSchema", () => {
  it("accepts six digits, ignoring surrounding spaces from a paste", () => {
    expect(verificationCodeSchema.parse(" 042913 ")).toBe("042913")
  })

  it.each([["12345"], ["1234567"], ["12345a"], ["12 345"], [""]])("rejects %o", (code) => {
    expect(verificationCodeSchema.safeParse(code).success).toBe(false)
  })
})
