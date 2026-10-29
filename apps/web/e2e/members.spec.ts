import { expect, test } from "@playwright/test"
import { Routes } from "@/lib/routes"
import { MEMBER_STORAGE_STATE } from "./auth-state"
import { openWithRetry, uniqueTitle } from "./helpers"

test("a guest opens a member profile from the members page", async ({ page }) => {
  await page.goto(Routes.MEMBERS.ROOT)
  await page
    .getByRole("link", { name: /Maya Chen/ })
    .first()
    .click()

  await expect(page.getByRole("heading", { level: 1, name: /Maya Chen/ })).toBeVisible()
})

test.describe("as a member", () => {
  test.use({ storageState: MEMBER_STORAGE_STATE })

  test("a member edits their own bio", async ({ page }) => {
    const bio = uniqueTitle("I run the capstone at Auckland.")
    await page.goto(`${Routes.MEMBERS.ROOT}?q=Arohan`)
    await page
      .getByRole("link", { name: /Arohan Patel/ })
      .first()
      .click()
    await expect(page.getByRole("heading", { level: 1, name: /Arohan Patel/ })).toBeVisible()

    const about = page.getByRole("textbox", { name: "About" })
    await openWithRetry(page.getByRole("button", { name: "Edit" }), about)
    await about.fill(bio)
    await page.getByRole("button", { name: "Done" }).click()
    await expect(page.getByRole("button", { name: "Edit" })).toBeVisible()

    await page.reload()
    await expect(page.getByText(bio)).toBeVisible()
  })
})
