import { describe, expect, it } from "vitest"
import { Slugs } from "@/lib/payload/slugs"
import { Institutions } from "./Institutions"

const findField = (name: string) =>
  Institutions.fields.find((field) => "name" in field && field.name === name)

describe("Institutions collection", () => {
  it("shows the logo on the ticker by default once one is uploaded", () => {
    expect(findField("showLogo")).toMatchObject({ type: "checkbox", defaultValue: true })
  })

  it("keeps the logo optional so existing institutions aren't broken", () => {
    const logo = findField("logo")
    expect(logo).toMatchObject({ type: "upload", relationTo: Slugs.Collections.MEDIA })
    expect(logo).not.toHaveProperty("required", true)
  })
})
