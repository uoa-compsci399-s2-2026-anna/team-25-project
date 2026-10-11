import { describe, expect, it } from "vitest"
import { normaliseResearchInterests } from "./research-interests"

describe("normaliseResearchInterests", () => {
  it("trims each interest", () => {
    expect(normaliseResearchInterests(["  Teamwork  ", "Ethics\n"])).toEqual(["Teamwork", "Ethics"])
  })

  it("drops blank and whitespace-only interests", () => {
    expect(normaliseResearchInterests(["", "   ", "Ethics"])).toEqual(["Ethics"])
  })

  // Compared after trimming, so " Teamwork" and "Teamwork" are the same interest.
  it("keeps the first of each repeat, in order", () => {
    expect(normaliseResearchInterests(["Teamwork", "Ethics", " Teamwork"])).toEqual([
      "Teamwork",
      "Ethics",
    ])
  })

  // Postgres compares case-sensitively, so folding case would hide members who spelled it otherwise.
  it("leaves case alone", () => {
    expect(normaliseResearchInterests(["Teamwork", "teamwork"])).toEqual(["Teamwork", "teamwork"])
  })
})
