import { expect, test } from "@playwright/test"
import { Routes } from "@/lib/routes"

test("a guest goes from the home page to registration", async ({ page }) => {
  await page.goto(Routes.HOME)
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible()

  await page.getByRole("link", { name: "Join CCCA" }).first().click()

  await expect(page).toHaveURL(Routes.REGISTER.ROOT)
  await expect(page.getByRole("heading", { name: "Join CCCA" })).toBeVisible()
})
