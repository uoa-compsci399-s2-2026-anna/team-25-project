import type { PayloadRequest, TextFieldSingleValidation } from "payload"
import { describe, expect, it } from "vitest"
import { validateDoi, validateUrl } from "./Publications"

// The real text validator also reads the config's default max length.
const req = { payload: { config: {} }, t: (key: string) => key } as unknown as PayloadRequest
const options: Parameters<TextFieldSingleValidation>[1] = {
  name: "doi",
  type: "text",
  blockData: {},
  data: {},
  path: ["doi"],
  preferences: { fields: {} },
  siblingData: {},
  req,
}

describe("validateDoi", () => {
  it.each([undefined, null, ""])("keeps the DOI optional (%j)", async (value) => {
    expect(await validateDoi(value, options)).toBe(true)
  })

  it.each(["10.1145/3313831.3376518", "10.1000/xyz123"])("accepts %s", async (value) => {
    expect(await validateDoi(value, options)).toBe(true)
  })

  it.each([
    "https://doi.org/10.1145/3313831.3376518",
    "11.1145/3313831",
    "10.12/abc",
    "10.1145/",
    "10.1145/has space",
  ])("rejects %s", async (value) => {
    expect(await validateDoi(value, options)).toBe("Enter a DOI that starts with 10.")
  })
})

describe("validateUrl", () => {
  const urlOptions = { ...options, name: "url", path: ["url"] }

  it.each([undefined, null, ""])("keeps the URL optional (%j)", async (value) => {
    expect(await validateUrl(value, urlOptions)).toBe(true)
  })

  it.each(["https://example.com/paper", "http://example.org"])("accepts %s", async (value) => {
    expect(await validateUrl(value, urlOptions)).toBe(true)
  })

  it.each(["javascript:alert(1)", "data:text/html,x", "example.com"])(
    "rejects %s",
    async (value) => {
      expect(await validateUrl(value, urlOptions)).toBe(
        "Enter a full URL that starts with https:// or http://",
      )
    },
  )
})
