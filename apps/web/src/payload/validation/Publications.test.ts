import type { PayloadRequest, TextFieldSingleValidation } from "payload"
import { describe, expect, it } from "vitest"
import { validateDoi } from "./Publications"

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
