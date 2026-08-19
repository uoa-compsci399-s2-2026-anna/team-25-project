import { describe, expect, it } from "vitest"
import { GET } from "./route"

describe("api/health", () => {
  describe("GET", () => {
    it("should return status ok", async () => {
      const response = GET()
      expect(response.status).toBe(200)
      const json = await response.json()
      expect(json).toEqual({ status: "ok" })
    })
  })
})
