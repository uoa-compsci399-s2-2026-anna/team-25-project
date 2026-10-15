import { describe, expect, it } from "vitest"
import { ProposalEthicsStatus, ProposalTimeframeStartPeriod } from "../enums/proposals"
import { createProposalSchema, postProposalFormSchema, updateProposalSchema } from "./proposals"

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

  const bodyWithText = {
    root: {
      ...validBody.root,
      children: [
        { type: "paragraph", version: 1, children: [{ type: "text", version: 1, text: "Hi" }] },
      ],
    },
  }

  it("accepts what the post-proposal form collects, without author", () => {
    const result = postProposalFormSchema.safeParse({
      ...formInput,
      body: bodyWithText,
      outputTarget: "",
    })
    expect(result.success).toBe(true)
  })

  it("rejects a plain-text body", () => {
    const result = postProposalFormSchema.safeParse({
      ...formInput,
      body: "The proposal body.",
      outputTarget: "",
    })
    expect(result.success).toBe(false)
  })

  it.each([
    ["no nodes", { root: { ...validBody.root, children: [] } }],
    ["an empty paragraph", validBody],
    [
      "only whitespace",
      {
        root: {
          ...validBody.root,
          children: [
            { type: "paragraph", version: 1, children: [{ type: "text", version: 1, text: "  " }] },
          ],
        },
      },
    ],
  ])("rejects a rich-text body with %s", (_label, body) => {
    const result = postProposalFormSchema.safeParse({ ...formInput, body, outputTarget: "" })
    expect(result.success).toBe(false)
    expect(!result.success && result.error.issues[0]?.message).toBe("Body is required")
  })
})

describe("updateProposalSchema", () => {
  it("accepts a single changed field", () => {
    expect(updateProposalSchema.safeParse({ title: "New title" }).success).toBe(true)
  })

  it("still applies a field's rules when it is sent", () => {
    const result = updateProposalSchema.safeParse({ title: "" })
    expect(!result.success && result.error.issues[0]?.message).toBe("Title is required")
  })

  it("strips fields an edit may not change", () => {
    const result = updateProposalSchema.safeParse({
      author: [99],
      institutions: [3],
      status: "closed",
      title: "New title",
    })
    expect(result.success && result.data).toEqual({ title: "New title" })
  })
})
