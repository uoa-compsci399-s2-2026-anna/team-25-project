import { expect, test } from "@playwright/test"
import { Routes } from "@/lib/routes"

for (const { path, title } of [
  { path: Routes.GUIDELINES, title: "Community Guidelines | CCCA" },
  { path: Routes.PRIVACY, title: "Privacy Policy | CCCA" },
]) {
  test(`${path} renders for a guest`, async ({ page }) => {
    await page.goto(path)

    await expect(page).toHaveTitle(title)
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
  })
}
