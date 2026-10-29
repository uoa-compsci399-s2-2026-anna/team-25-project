import { expect, test } from "@playwright/test"

test("an unknown path shows the not found page", async ({ page }) => {
  const response = await page.goto("/no-such-page")

  expect(response?.status()).toBe(404)
  await expect(page.getByRole("heading", { name: "We cannot find that page." })).toBeVisible()
})
