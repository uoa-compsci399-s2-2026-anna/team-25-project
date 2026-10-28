import path from "node:path"
import { expect, test } from "@playwright/test"
import { Routes } from "@/lib/routes"
import { MEMBER_STORAGE_STATE } from "./auth-state"
import { gotoHydrated, uniqueTitle } from "./helpers"

test.use({ storageState: MEMBER_STORAGE_STATE })

const ATTACHMENT = path.resolve("src/payload/seed-files/final-presentation-marking-sheet.pdf")

test("a member shares, edits and deletes a resource", async ({ page }) => {
  const title = uniqueTitle("Stand-up meeting template")
  const editedTitle = `${title} (revised)`
  await gotoHydrated(page, Routes.RESOURCES.ROOT)

  await page.getByRole("button", { name: "+ Contribute a resource" }).click()
  const dialog = page.getByRole("dialog", { name: "Contribute a resource" })
  await dialog.getByRole("textbox", { name: "Title" }).fill(title)
  await dialog.getByRole("textbox", { name: "Description" }).fill("Prompts for a daily stand-up.")
  const fileChooser = page.waitForEvent("filechooser")
  await dialog.getByRole("button", { name: "Attachments Add files" }).click()
  await (await fileChooser).setFiles(ATTACHMENT)
  await expect(dialog.getByText("final-presentation-marking-sheet.pdf")).toBeVisible()
  await dialog.getByRole("button", { name: "Share resource" }).click()
  await expect(dialog).toBeHidden()

  await page.getByRole("link", { name: title }).first().click()
  await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible()
  // The stored copy gets a numbered name when the seed already uploaded that file.
  await expect(page.getByRole("heading", { name: "Attachments - 1" })).toBeVisible()

  await page.getByRole("button", { name: `Actions for ${title}` }).click()
  await page.getByRole("menuitem", { name: "Edit" }).click()
  await page.getByRole("textbox", { name: "Title" }).fill(editedTitle)
  await page.getByRole("button", { name: "Done" }).click()
  await expect(page.getByRole("heading", { level: 1, name: editedTitle })).toBeVisible()

  await page.getByRole("button", { name: `Actions for ${editedTitle}` }).click()
  await page.getByRole("menuitem", { name: "Delete" }).click()
  await page.getByRole("button", { name: "Confirm delete" }).click()
  await expect(page).toHaveURL(Routes.RESOURCES.ROOT)
})
