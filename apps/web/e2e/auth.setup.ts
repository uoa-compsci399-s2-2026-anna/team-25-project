import { expect, test as setup } from "@playwright/test"
import { Routes } from "@/lib/routes"

export const MEMBER_STORAGE_STATE = "e2e/.auth/member.json"

setup("log in as a member", async ({ page }) => {
  // Wait for hydration: it resets the controlled inputs, which wipes anything typed before it.
  await page.goto(Routes.LOGIN, { waitUntil: "networkidle" })
  await page.getByLabel("University email").fill("arohan.patel@auckland.ac.nz")
  await page.getByLabel("Password").fill("changeme")
  await page.getByRole("button", { name: "Log in" }).click()
  await expect(page).not.toHaveURL(/\/login/)
  await page.context().storageState({ path: MEMBER_STORAGE_STATE })
})
