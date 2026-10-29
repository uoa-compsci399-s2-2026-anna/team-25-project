import { expect, test } from "@playwright/test"
import { Routes } from "@/lib/routes"
import { logIn } from "./helpers"

// Logs in through the form instead of the saved session: logging out ends the session.
test("a guest logs in, returns to the page they asked for, and logs out", async ({ page }) => {
  await page.goto(Routes.PROPOSALS.ROOT)
  await expect(page).toHaveURL(/\/login\?redirect=%2Fproposals/)
  await page.waitForLoadState("networkidle")

  await logIn(page, "maya.chen@auckland.ac.nz")
  await expect(page).toHaveURL(Routes.PROPOSALS.ROOT)

  await page.getByRole("button", { name: "Maya Chen" }).click()
  await page.getByRole("button", { name: "Log out" }).click()

  await expect(page).toHaveURL(Routes.HOME)
  await expect(page.getByRole("link", { name: "Log in" })).toBeVisible()
})
