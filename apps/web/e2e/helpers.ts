import { expect, type Locator, type Page } from "@playwright/test"
import { Routes } from "@/lib/routes"

/**
 * Opens a page and waits until the network is idle, which is usually after hydration.
 * Before hydration, clicks do nothing and hydration resets anything typed.
 */
export async function gotoHydrated(page: Page, path: string) {
  await page.goto(path, { waitUntil: "networkidle" })
}

/**
 * Clicks `trigger` until `opened` shows. `networkidle` does not prove that a Suspense
 * boundary has hydrated, and a click before hydration does nothing.
 */
export async function openWithRetry(trigger: Locator, opened: Locator) {
  await expect(async () => {
    if (!(await opened.isVisible())) await trigger.click({ timeout: 1_000 })
    await expect(opened).toBeVisible({ timeout: 1_000 })
  }).toPass()
}

/** Logs in through the form. Seeded members all use the password "changeme". */
export async function logIn(page: Page, email: string) {
  await page.getByLabel("University email").fill(email)
  await page.getByLabel("Password").fill("changeme")
  await page.getByRole("button", { name: "Log in" }).click()
  await page.waitForURL((url) => url.pathname !== Routes.LOGIN)
}

/** A title no other run has used, so tests that create records do not collide. */
export const uniqueTitle = (prefix: string) => `${prefix} ${Date.now()}`
