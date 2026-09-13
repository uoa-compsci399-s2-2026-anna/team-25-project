import { describe, expect, it } from "vitest"
import { z } from "zod"
import { validateField } from "./validate-field"

describe("validateField", () => {
  it("returns no error for a valid value", () => {
    const validate = validateField(z.string().min(3, "Too short"))

    expect(validate({ value: "abc" })).toBeUndefined()
  })

  it("returns the first issue message for an invalid value", () => {
    const validate = validateField(z.string().min(3, "Too short"))

    expect(validate({ value: "ab" })).toEqual({ message: "Too short" })
  })

  it("skips empty, undefined, and null values so required stays a submit-time error", () => {
    const validate = validateField(z.string().min(1, "Required"))

    expect(validate({ value: "" })).toBeUndefined()
    expect(validate({ value: undefined as unknown as string })).toBeUndefined()
    expect(validate({ value: null as unknown as string })).toBeUndefined()
  })

  it("validates zero, which is empty-looking but a real value", () => {
    const validate = validateField(z.number().min(1, "Too small"))

    expect(validate({ value: 0 })).toEqual({ message: "Too small" })
  })

  it("validates non-string schemas such as numbers and enums", () => {
    const year = validateField(z.number().int().min(2000).max(2100))
    const period = validateField(z.enum(["sem1", "sem2"]))

    expect(year({ value: 2026 })).toBeUndefined()
    expect(year({ value: 1999 })?.message).toBeDefined()
    expect(period({ value: "sem2" })).toBeUndefined()
    expect(period({ value: "summer" as "sem1" | "sem2" })?.message).toBeDefined()
  })
})
