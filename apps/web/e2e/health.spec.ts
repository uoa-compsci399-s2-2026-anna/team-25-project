import { expect, test } from "@playwright/test"

test("health check reports ok", async ({ request }) => {
  const response = await request.get("/api/health")

  expect(response.ok()).toBe(true)
  expect(await response.json()).toEqual({ status: "ok" })
})
