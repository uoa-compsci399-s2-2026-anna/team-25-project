import { describe, expect, it } from "vitest"
import { parseProposalId, proposalPath } from "./proposal-url"

describe("proposalPath", () => {
  it.each([42, "42", 0])("builds a slugged path for id %j", (id) => {
    expect(proposalPath({ id, proposalSlug: "team-assessment-fairness" })).toBe(
      `/proposals/${id}-team-assessment-fairness`,
    )
  })

  it("builds a path when the slug is omitted", () => {
    expect(proposalPath({ id: 42 })).toBe("/proposals/42")
  })

  it.each([undefined, null, ""])("omits the separator for slug %j", (proposalSlug) => {
    expect(proposalPath({ id: 42, proposalSlug })).toBe("/proposals/42")
  })

  it("preserves string ids", () => {
    expect(proposalPath({ id: "0042", proposalSlug: "assessment" })).toBe(
      "/proposals/0042-assessment",
    )
  })
})

describe("parseProposalId", () => {
  it.each([
    // [slug, resolved id]
    ["42", 42],
    ["42-team-assessment-fairness", 42],
    ["42-updated-title-2026", 42],
    ["0042-assessment", 42],
    ["0-assessment", 0],
    ["42-", 42],
    ["42abc", 42],
    ["42.5", 42],
  ])("reads the leading digits from %j", (param, expected) => {
    expect(parseProposalId(param)).toBe(expected)
  })

  it.each(["", "assessment", "assessment-42", "-42", "+42", " 42", "/proposals/42"])(
    "rejects %j because it does not start with digits",
    (param) => {
      expect(parseProposalId(param)).toBeNull()
    },
  )
})
