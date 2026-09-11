import { describe, expect, it } from "vitest"
import { emailDomain, isRecognisedEmail } from "./recognisedEmail"

const AUCKLAND = ["auckland.ac.nz"]

describe("emailDomain", () => {
  it("takes everything after the last @", () => {
    expect(emailDomain("a.tui@example.ac.nz")).toBe("example.ac.nz")
  })

  it("lowercases and trims", () => {
    expect(emailDomain("A.Tui@ Example.AC.NZ ")).toBe("example.ac.nz")
  })
})

describe("isRecognisedEmail", () => {
  it("accepts an exact domain match", () => {
    expect(isRecognisedEmail("a.tui@auckland.ac.nz", AUCKLAND)).toBe(true)
  })

  it("accepts a subdomain", () => {
    expect(isRecognisedEmail("a.tui@cs.auckland.ac.nz", AUCKLAND)).toBe(true)
  })

  it("rejects a domain that merely ends with the same letters", () => {
    // The leading dot on the suffix check is what stops this matching.
    expect(isRecognisedEmail("a.tui@notauckland.ac.nz", AUCKLAND)).toBe(false)
  })

  it("rejects an unrelated domain", () => {
    expect(isRecognisedEmail("a.tui@gmail.com", AUCKLAND)).toBe(false)
  })

  it("is case insensitive", () => {
    expect(isRecognisedEmail("A.Tui@Auckland.AC.NZ", AUCKLAND)).toBe(true)
  })

  it("returns false before an @ has been typed", () => {
    expect(isRecognisedEmail("a.tui", AUCKLAND)).toBe(false)
  })

  it("returns false when no institution is selected yet", () => {
    expect(isRecognisedEmail("a.tui@auckland.ac.nz", [])).toBe(false)
  })

  it("checks every domain an institution registers", () => {
    expect(isRecognisedEmail("a.tui@aucklanduni.ac.nz", [...AUCKLAND, "aucklanduni.ac.nz"])).toBe(
      true,
    )
  })
})
