import { describe, expect, it } from "vitest"
import { memberProfileSchema } from "./members"

describe("memberProfileSchema", () => {
  it("accepts only some of the fields", () => {
    expect(memberProfileSchema.parse({ bio: "  Hello  " })).toEqual({ bio: "Hello" })
  })

  it("accepts a null title", () => {
    expect(memberProfileSchema.safeParse({ title: null }).success).toBe(true)
  })

  it.each([
    ["a blank first name", { firstName: "  " }, "First name is required"],
    ["a blank position", { position: "" }, "Position is required"],
    [
      "a position over 100 characters",
      { position: "x".repeat(101) },
      "Keep your position under 100",
    ],
    ["a bio over 500 characters", { bio: "x".repeat(501) }, "Keep your bio under 500"],
  ])("rejects %s", (_, input, message) => {
    const result = memberProfileSchema.safeParse(input)
    expect(result.error?.issues[0]?.message).toContain(message)
  })

  it("rejects a title that isn't in the enum", () => {
    expect(memberProfileSchema.safeParse({ title: "king" }).success).toBe(false)
  })

  describe("researchInterests", () => {
    const tenInterests = Array.from({ length: 10 }, (_, i) => `Interest ${i}`)

    it("drops blank and repeated interests", () => {
      const result = memberProfileSchema.parse({ researchInterests: [" AI ", "", "AI", "HCI"] })
      expect(result.researchInterests).toEqual(["AI", "HCI"])
    })

    it("counts repeats once towards the limit of 10", () => {
      const result = memberProfileSchema.safeParse({
        researchInterests: [...tenInterests, "Interest 0", " "],
      })
      expect(result.success).toBe(true)
    })

    // The form only shows errors on paths that match one of its fields.
    it.each([
      ["more than 10 interests", [...tenInterests, "One more"], "Add up to 10 research interests"],
      [
        "an interest over 50 characters",
        ["AI", "x".repeat(51)],
        "Keep each research interest under 50 characters",
      ],
    ])("reports %s on the list itself", (_, researchInterests, message) => {
      const result = memberProfileSchema.safeParse({ researchInterests })
      expect(result.error?.issues).toEqual([
        expect.objectContaining({ message, path: ["researchInterests"] }),
      ])
    })
  })
})
