import { describe, expect, it } from "vitest"
import { CourseDeliveryFormat } from "./courses"

describe("CourseDeliveryFormat", () => {
  // The stored values reach the database through the field's option list, so a
  // rename here silently invalidates every saved offering.
  it("keeps the values Payload persists", () => {
    expect(CourseDeliveryFormat).toEqual({
      IN_PERSON: "inPerson",
      ONLINE: "online",
      HYBRID: "hybrid",
    })
  })
})
