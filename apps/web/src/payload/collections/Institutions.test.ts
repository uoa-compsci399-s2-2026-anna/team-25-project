import { describe, expect, it } from "vitest"
import { Slugs } from "@/lib/payload/slugs"
import { Institutions } from "./Institutions"

const findField = (name: string) =>
  Institutions.fields.find((field) => "name" in field && field.name === name)

describe("Institutions collection", () => {
  it("keeps the logo hidden from the ticker until an admin opts in", () => {
    expect(findField("showLogo")).toMatchObject({ type: "checkbox", defaultValue: false })
  })

  it("keeps the logo optional so existing institutions aren't broken", () => {
    const logo = findField("logo")
    expect(logo).toMatchObject({ type: "upload", relationTo: Slugs.Collections.MEDIA })
    expect(logo).not.toHaveProperty("required", true)
  })
})
