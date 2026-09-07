import { describe, expect, expectTypeOf, it } from "vitest"
import { type ProposalStatus, ProposalStatusLabels } from "../enums/proposals"
import { toSelectOptions } from "./select-options"

describe("toSelectOptions", () => {
  it("converts real labels into options and preserves the value union", () => {
    const options = toSelectOptions(ProposalStatusLabels)

    expect(options).toEqual([
      { label: "Active", value: "active" },
      { label: "Closed", value: "closed" },
    ])
    expectTypeOf(options).toEqualTypeOf<{ label: string; value: ProposalStatus }[]>()
  })

  it("returns no options for an empty map", () => {
    expect(toSelectOptions({})).toEqual([])
  })

  it("preserves insertion order, duplicate labels, and empty labels", () => {
    expect(toSelectOptions({ second: "Same", first: "Same", blank: "" })).toEqual([
      { label: "Same", value: "second" },
      { label: "Same", value: "first" },
      { label: "", value: "blank" },
    ])
  })

  it("returns independent options without mutating the labels", () => {
    const labels = Object.freeze({ active: "Active" })
    const options = toSelectOptions(labels)

    for (const option of options) {
      option.label = "Changed"
    }

    expect(labels).toEqual({ active: "Active" })
    expect(toSelectOptions(labels)).toEqual([{ label: "Active", value: "active" }])
  })
})
