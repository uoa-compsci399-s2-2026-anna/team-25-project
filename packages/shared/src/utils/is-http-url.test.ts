import { describe, expect, it } from "vitest"
import { isHttpUrl } from "./is-http-url"

describe("isHttpUrl", () => {
  it.each(["https://github.com/anna", "http://example.ac.nz/staff/anna"])("accepts %s", (value) => {
    expect(isHttpUrl(value)).toBe(true)
  })

  it.each(["javascript:alert(1)", "mailto:anna@example.com", "github.com/anna", "not a url", ""])(
    "rejects %s",
    (value) => {
      expect(isHttpUrl(value)).toBe(false)
    },
  )
})
