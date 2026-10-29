import { expect, test } from "@playwright/test"
import { Routes } from "@/lib/routes"
import { MEMBER_STORAGE_STATE } from "./auth-state"
import { gotoHydrated, openWithRetry, uniqueTitle } from "./helpers"

test.use({ storageState: MEMBER_STORAGE_STATE })

test("a member adds, edits and deletes a publication", async ({ page }) => {
  const title = uniqueTitle("Teaching retrospectives to capstone teams")
  const editedTitle = `${title} (revised)`
  await gotoHydrated(page, Routes.PUBLICATIONS)

  const addDialog = page.getByRole("dialog", { name: "Add a publication" })
  await openWithRetry(page.getByRole("button", { name: "+ Add a publication" }), addDialog)
  await addDialog.getByRole("button", { name: "Manual entry" }).click()
  await addDialog.getByRole("textbox", { name: "Title" }).fill(title)
  await addDialog
    .getByRole("textbox", { name: "Venue" })
    .fill("Journal of Computing Capstone Education")
  await addDialog.getByRole("textbox", { name: "URL" }).fill("https://example.com/retrospectives")
  await addDialog.getByRole("button", { name: "Add publication" }).click()
  await expect(addDialog).toBeHidden()

  await page.getByRole("button", { name: `Actions for ${title}` }).click()
  await page.getByRole("menuitem", { name: "Edit" }).click()
  const editDialog = page.getByRole("dialog", { name: "Edit publication" })
  await editDialog.getByRole("textbox", { name: "Title" }).fill(editedTitle)
  await editDialog.getByRole("button", { name: "Save changes" }).click()
  await expect(editDialog).toBeHidden()
  await expect(page.getByRole("link", { name: editedTitle })).toBeVisible()

  await page.getByRole("button", { name: `Actions for ${editedTitle}` }).click()
  await page.getByRole("menuitem", { name: "Delete" }).click()
  await page.getByRole("button", { name: "Confirm delete" }).click()
  await expect(page.getByText("Publication deleted")).toBeVisible()
  await page.reload()
  await expect(page.getByRole("link", { name: editedTitle })).toBeHidden()
})

test("a member imports a publication from BibTeX", async ({ page }) => {
  const title = uniqueTitle("Mentoring capstone teams")
  // Citation keys are unique, so a fixed key fails on the next run.
  const citationKey = `patel${Date.now()}`
  await gotoHydrated(page, Routes.PUBLICATIONS)

  const dialog = page.getByRole("dialog", { name: "Add a publication" })
  await openWithRetry(page.getByRole("button", { name: "+ Add a publication" }), dialog)
  await dialog.getByRole("textbox", { name: "Paste a BibTeX entry" }).fill(
    `@article{${citationKey},
  title = {${title}},
  author = {Patel, Arohan},
  journal = {Journal of Computing Capstone Education},
  year = {2026},
  url = {https://example.com/mentoring}
}`,
  )
  await dialog.getByRole("button", { name: "Import", exact: true }).click()
  await expect(dialog.getByRole("textbox", { name: "Title" })).toHaveValue(title)
  await dialog.getByRole("button", { name: "Add publication" }).click()

  await expect(dialog).toBeHidden()
  await expect(page.getByRole("link", { name: title })).toBeVisible()
})
