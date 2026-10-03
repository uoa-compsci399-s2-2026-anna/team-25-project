import { describe, expect, it } from "vitest"
import { Publications } from "./Publications"

describe("Publications collection", () => {
  it("lets anyone read publications", () => {
    const read = Publications.access?.read as () => boolean
    expect(read()).toBe(true)
  })
})
