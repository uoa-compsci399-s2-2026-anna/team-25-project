import { test as setup } from "@playwright/test"
import { Routes } from "@/lib/routes"
import { MEMBER_STORAGE_STATE } from "./auth-state"
import { gotoHydrated, logIn } from "./helpers"

setup("log in as a member", async ({ page }) => {
  await gotoHydrated(page, Routes.LOGIN)
  await logIn(page, "arohan.patel@auckland.ac.nz")
  await page.context().storageState({ path: MEMBER_STORAGE_STATE })
})
