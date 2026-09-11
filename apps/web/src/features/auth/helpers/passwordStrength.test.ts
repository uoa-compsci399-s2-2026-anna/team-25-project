import { describe, expect, it } from "vitest"
import { PASSWORD_STRENGTH_STEPS, passwordStrength } from "./passwordStrength"

describe("passwordStrength", () => {
  it.each([[""], ["short"], ["1234567"]])("scores %o as too short", (password) => {
    expect(passwordStrength(password)).toEqual({ label: "Too short", score: 0 })
  })

  it("scores a long-enough but plain password as weak", () => {
    expect(passwordStrength("password")).toEqual({ label: "Weak", score: 1 })
  })

  it("credits mixed case", () => {
    expect(passwordStrength("Password")).toEqual({ label: "Fair", score: 2 })
  })

  it("credits mixed case and a digit", () => {
    expect(passwordStrength("Password1")).toEqual({ label: "Good", score: 3 })
  })

  it("credits mixed case, a digit and a symbol", () => {
    expect(passwordStrength("Password1!")).toEqual({ label: "Strong", score: 4 })
  })

  it("credits length on its own", () => {
    expect(passwordStrength("passwordpassword")).toEqual({ label: "Fair", score: 2 })
  })

  it("never scores above the number of meter segments", () => {
    const { score } = passwordStrength("SuperSecret123!$%^")
    expect(score).toBe(PASSWORD_STRENGTH_STEPS)
  })

  it("treats a password that only just clears the minimum as scoreable", () => {
    // Exactly at the schema minimum - the meter must not call this "Too short",
    // or it would contradict the validation that just accepted it.
    expect(passwordStrength("abcdefgh").score).toBeGreaterThan(0)
  })
})
