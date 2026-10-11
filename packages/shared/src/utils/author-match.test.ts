import { describe, expect, it } from "vitest"
import { matchMember, parsePrintedName, suggestMembers } from "./author-match"

const jane = { firstName: "Jane", lastName: "Smith" }
const john = { firstName: "John", lastName: "Smith" }

const match = (printed: string, member = jane) => matchMember(parsePrintedName(printed), member)

describe("parsePrintedName", () => {
  it.each([
    ["Jane Smith", { given: ["jane"], family: "smith" }],
    ["Smith, Jane A.", { given: ["jane", "a"], family: "smith" }],
    ["Jörg Müller", { given: ["jorg"], family: "muller" }],
  ])("reads %s", (input, expected) => {
    expect(parsePrintedName(input)).toEqual(expected)
  })

  it("reads a BibTeX creator with a prefix", () => {
    expect(parsePrintedName({ firstName: "Anna", prefix: "van der", lastName: "Berg" })).toEqual({
      given: ["anna"],
      family: "van der berg",
    })
  })
})

describe("matchMember", () => {
  it.each([
    ["Jane Smith", "exact"],
    ["Smith, Jane", "exact"],
    ["JANE SMITH", "exact"],
    ["J. Smith", "initials"],
    ["Smith, J.", "initials"],
    ["J. A. Smith", "initials"],
    ["Jane A. Smith", "initials"],
  ])("%s → %s", (printed, expected) => {
    expect(match(printed)).toBe(expected)
  })

  it.each([
    ["a different given name", "Joan Smith"],
    ["a different family name", "Jane Smyth"],
    ["a different initial", "K. Smith"],
    ["only the family name", "Smith"],
  ])("does not match %s", (_, printed) => {
    expect(match(printed)).toBeNull()
  })

  it("does not match a different middle name", () => {
    expect(match("Jane B. Smith", { firstName: "Jane Anne", lastName: "Smith" })).toBeNull()
  })

  it("ignores accents", () => {
    expect(match("Jorg Muller", { firstName: "Jörg", lastName: "Müller" })).toBe("exact")
  })

  it("matches a braced full name", () => {
    expect(matchMember(parsePrintedName({ name: "Jane Smith" }), jane)).toBe("exact")
  })
})

describe("suggestMembers", () => {
  it("lists every member with a matching name, exact first", () => {
    const janeA = { firstName: "Jane A.", lastName: "Smith" }
    const result = suggestMembers(parsePrintedName("Jane A. Smith"), [john, jane, janeA])
    expect(result).toEqual([janeA, jane])
  })
})
