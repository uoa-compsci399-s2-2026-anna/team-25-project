import { test as setup } from "@playwright/test"
import { Routes } from "@/lib/routes"
import { ADMIN_STORAGE_STATE, MEMBER_STORAGE_STATE, SEED_ADMIN } from "./auth-state"
import { gotoHydrated, logIn } from "./helpers"

setup("log in as a member", async ({ page }) => {
  await gotoHydrated(page, Routes.LOGIN)
  await logIn(page, "arohan.patel@auckland.ac.nz")
  await page.context().storageState({ path: MEMBER_STORAGE_STATE })
})

// Admins are Payload users, not members, so they log in through Payload's own form.
setup("log in as an admin", async ({ page }) => {
  await gotoHydrated(page, `${Routes.ADMIN}/login`)
  await page.getByLabel("Email").fill(SEED_ADMIN.email)
  await page.getByLabel("Password").fill(SEED_ADMIN.password)
  await page.getByRole("button", { name: "Login" }).click()
  await page.waitForURL((url) => !url.pathname.endsWith("/login"))
  await page.context().storageState({ path: ADMIN_STORAGE_STATE })
})
