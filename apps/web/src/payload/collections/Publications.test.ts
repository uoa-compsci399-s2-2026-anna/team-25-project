import { describe, expect, it } from "vitest"
import { Publications } from "./Publications"

const doi = Publications.fields.find((field) => "name" in field && field.name === "doi")
const validateDoi = (value: string | null | undefined) =>
  (doi as { validate: (value: string | null | undefined) => true | string }).validate(value)

describe("Publications collection", () => {
  it("lets anyone read publications", () => {
    const read = Publications.access?.read as () => boolean
    expect(read()).toBe(true)
  })

  it.each([undefined, null, ""])("keeps the DOI optional (%j)", (value) => {
    expect(validateDoi(value)).toBe(true)
  })

  it.each(["10.1145/3313831.3376518", "10.1000/xyz123"])("accepts the DOI %s", (value) => {
    expect(validateDoi(value)).toBe(true)
  })

  it.each([
    "https://doi.org/10.1145/3313831.3376518",
    "11.1145/3313831",
    "10.12/abc",
    "10.1145/",
    "10.1145/has space",
  ])("rejects the DOI %s", (value) => {
    expect(validateDoi(value)).toBe("Enter a DOI that starts with 10.")
  })
})
