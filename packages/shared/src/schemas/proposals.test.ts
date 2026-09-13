import { describe, expect, it } from "vitest"
import { ProposalEthicsStatus, ProposalTimeframeStartPeriod } from "../enums/proposals"
import { createProposalSchema, postProposalFormSchema } from "./proposals"

const validBody = {
  root: {
    type: "root",
    children: [{ type: "paragraph", version: 1 }],
    direction: "ltr" as const,
    format: "" as const,
    indent: 0,
    version: 1,
  },
}

const validInput = {
  author: [1],
  title: "Assessment fairness across institutions",
  summary: "A short summary of the proposal.",
  body: validBody,
  timeframe: {
    startYear: 2027,
    startPeriod: ProposalTimeframeStartPeriod.SEM_1,
  },
  ethics: ProposalEthicsStatus.UNKNOWN,
}

describe("createProposalSchema", () => {
  it("accepts a minimal valid proposal", () => {
    expect(createProposalSchema.safeParse(validInput).success).toBe(true)
  })

  it("defaults status to active", () => {
    const result = createProposalSchema.safeParse(validInput)
    expect(result.success && result.data.status).toBe("active")
  })

  it.each(["author", "title", "summary", "body", "ethics", "timeframe"] as const)(
    "requires %s",
    (field) => {
      const { [field]: _omitted, ...rest } = validInput
      expect(createProposalSchema.safeParse(rest).success).toBe(false)
    },
  )

  it("rejects a summary over 500 characters", () => {
    expect(
      createProposalSchema.safeParse({ ...validInput, summary: "a".repeat(501) }).success,
    ).toBe(false)
  })

  it("rejects an end year before the start year", () => {
    const result = createProposalSchema.safeParse({
      ...validInput,
      timeframe: { ...validInput.timeframe, endYear: 2026 },
    })
    expect(result.success).toBe(false)
  })

  it("rejects an end period without an end year", () => {
    const result = createProposalSchema.safeParse({
      ...validInput,
      timeframe: { ...validInput.timeframe, endPeriod: "early" },
    })
    expect(result.success).toBe(false)
  })

  it("accepts a full timeframe", () => {
    const result = createProposalSchema.safeParse({
      ...validInput,
      timeframe: { ...validInput.timeframe, endYear: 2027, endPeriod: "late" },
    })
    expect(result.success).toBe(true)
  })
})

describe("postProposalFormSchema", () => {
  const { author, ...formInput } = validInput

  it("accepts what the post-proposal form collects, without author", () => {
    const result = postProposalFormSchema.safeParse({
      ...formInput,
      body: "The proposal body.",
      outputTarget: "",
    })
    expect(result.success).toBe(true)
  })

  it("requires a plain-text body rather than a rich-text object", () => {
    const result = postProposalFormSchema.safeParse({
      ...formInput,
      body: validBody,
      outputTarget: "",
    })
    expect(result.success).toBe(false)
  })
})
