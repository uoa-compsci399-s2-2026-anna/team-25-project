import { ProposalTimeframeEndPeriodLabels } from "@repo/shared/enums/proposals"
import { toSelectOptions } from "@repo/shared/utils/select-options"
import type {
  NumberFieldSingleValidation,
  PayloadRequest,
  SelectFieldSingleValidation,
} from "payload"
import { describe, expect, it } from "vitest"
import { validateProposalEndPeriod, validateProposalEndYear } from "./Proposals"

// The real Payload validators only need translation from the request.
const req = { t: (key: string) => key } as PayloadRequest
const yearOptions: Parameters<NumberFieldSingleValidation>[1] = {
  name: "endYear",
  type: "number",
  min: 2000,
  max: 2100,
  blockData: {},
  data: {},
  path: ["timeframe", "endYear"],
  preferences: { fields: {} },
  siblingData: { startYear: 2026 },
  req,
}
const periodOptions: Parameters<SelectFieldSingleValidation>[1] = {
  name: "endPeriod",
  type: "select",
  options: toSelectOptions(ProposalTimeframeEndPeriodLabels),
  blockData: {},
  data: {},
  path: ["timeframe", "endPeriod"],
  preferences: { fields: {} },
  siblingData: {},
  req,
}

describe("validateProposalEndYear", () => {
  it.each([undefined, null])("allows an optional missing year (%s)", async (value) => {
    expect(await validateProposalEndYear(value, yearOptions)).toBe(true)
  })

  it.each([undefined, null])("preserves required validation (%s)", async (value) => {
    expect(await validateProposalEndYear(value, { ...yearOptions, required: true })).toBe(
      "validation:required",
    )
  })

  it.each([
    [1999, "validation:lessThanMin"],
    [2101, "validation:greaterThanMax"],
  ])("preserves the range error for %s before business validation", async (value, error) => {
    expect(await validateProposalEndYear(value, yearOptions)).toBe(error)
  })

  it.each([2000, 2100])("accepts the inclusive boundary %s", async (value) => {
    expect(await validateProposalEndYear(value, { ...yearOptions, siblingData: {} })).toBe(true)
  })

  it("rejects an end year before the start year", async () => {
    expect(await validateProposalEndYear(2025, yearOptions)).toBe(
      "End year cannot be before the start year.",
    )
  })

  it.each([2026, 2027])("accepts an end year equal to or after the start (%s)", async (value) => {
    expect(await validateProposalEndYear(value, yearOptions)).toBe(true)
  })

  it.each([{}, { startYear: null }, { startYear: "2027" }])(
    "skips comparison without a numeric start year: %j",
    async (siblingData) => {
      expect(await validateProposalEndYear(2026, { ...yearOptions, siblingData })).toBe(true)
    },
  )
})

describe("validateProposalEndPeriod", () => {
  it.each([undefined, null])("allows an optional missing period (%s)", async (value) => {
    expect(await validateProposalEndPeriod(value, periodOptions)).toBe(true)
  })

  it.each([undefined, null])("preserves required validation (%s)", async (value) => {
    expect(await validateProposalEndPeriod(value, { ...periodOptions, required: true })).toBe(
      "validation:required",
    )
  })

  it.each([false, true])("rejects an empty string when required is %s", async (required) => {
    expect(await validateProposalEndPeriod("", { ...periodOptions, required })).toBe(
      "validation:invalidSelection",
    )
  })

  it.each([{}, { endYear: 2026 }])("rejects an invalid select value: %j", async (siblingData) => {
    expect(await validateProposalEndPeriod("invalid", { ...periodOptions, siblingData })).toBe(
      "validation:invalidSelection",
    )
  })

  it.each(Object.keys(ProposalTimeframeEndPeriodLabels))(
    "accepts %s with an end year",
    async (value) => {
      expect(
        await validateProposalEndPeriod(value, {
          ...periodOptions,
          siblingData: { endYear: 2026 },
        }),
      ).toBe(true)
    },
  )

  it.each([{}, { endYear: null }, { endYear: "2026" }])(
    "requires a numeric end year for a selected period: %j",
    async (siblingData) => {
      expect(await validateProposalEndPeriod("early", { ...periodOptions, siblingData })).toBe(
        "Set an end year before choosing an end period.",
      )
    },
  )
})
