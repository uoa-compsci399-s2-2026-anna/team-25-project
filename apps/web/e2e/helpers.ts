import type { Page } from "@playwright/test"
import { Routes } from "@/lib/routes"

/**
 * Opens a page and waits for hydration. Before it, clicks do nothing and hydration
 * resets controlled inputs, which wipes anything typed.
 */
export async function gotoHydrated(page: Page, path: string) {
  await page.goto(path, { waitUntil: "networkidle" })
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
