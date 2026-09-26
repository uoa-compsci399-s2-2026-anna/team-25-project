import type { PayloadRequest, TextFieldSingleValidation } from "payload"
import { describe, expect, it } from "vitest"
import { validateMemberLinkUrl } from "./Members"

// The real text validator also reads the config's default max length.
const req = { payload: { config: {} }, t: (key: string) => key } as unknown as PayloadRequest
const options: Parameters<TextFieldSingleValidation>[1] = {
  name: "url",
  type: "text",
  blockData: {},
  data: {},
  path: ["links", 0, "url"],
  preferences: { fields: {} },
  siblingData: {},
  req,
}

describe("validateMemberLinkUrl", () => {
  it("preserves required validation", async () => {
    expect(await validateMemberLinkUrl("", { ...options, required: true })).toBe(
      "validation:required",
    )
  })

  it.each(["https://github.com/anna", "http://example.ac.nz/staff/anna"])(
    "accepts %s",
    async (value) => {
      expect(await validateMemberLinkUrl(value, options)).toBe(true)
    },
  )

  it.each(["javascript:alert(1)", "mailto:anna@example.com", "github.com/anna", "not a url"])(
    "rejects %s",
    async (value) => {
      expect(await validateMemberLinkUrl(value, options)).toBe(
        "Enter a full web address starting with http:// or https://",
      )
    },
  )
})
