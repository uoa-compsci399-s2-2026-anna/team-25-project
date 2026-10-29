import { describe, expect, it } from "vitest"
import { normaliseInterests } from "./interests"

describe("normaliseInterests", () => {
  it("trims each interest", () => {
    expect(normaliseInterests(["  Teamwork  ", "Ethics\n"])).toEqual(["Teamwork", "Ethics"])
  })

  it("drops blank and whitespace-only interests", () => {
    expect(normaliseInterests(["", "   ", "Ethics"])).toEqual(["Ethics"])
  })

  // Compared after trimming, so " Teamwork" and "Teamwork" are the same interest.
  it("keeps the first of each repeat, in order", () => {
    expect(normaliseInterests(["Teamwork", "Ethics", " Teamwork"])).toEqual(["Teamwork", "Ethics"])
  })

  // Postgres compares case-sensitively, so folding case would hide members who spelled it otherwise.
  it("leaves case alone", () => {
    expect(normaliseInterests(["Teamwork", "teamwork"])).toEqual(["Teamwork", "teamwork"])
  })
})
