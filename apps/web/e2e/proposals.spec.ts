import { expect, test } from "@playwright/test"
import { Routes } from "@/lib/routes"
import { MEMBER_STORAGE_STATE } from "./auth-state"
import { gotoHydrated, openWithRetry, uniqueTitle } from "./helpers"

test.use({ storageState: MEMBER_STORAGE_STATE })

test("a member posts, edits and deletes a proposal", async ({ page }) => {
  const title = uniqueTitle("Pair programming in capstone teams")
  await gotoHydrated(page, Routes.PROPOSALS.ROOT)

  const dialog = page.getByRole("dialog", { name: "Post a new proposal" })
  await openWithRetry(page.getByRole("button", { name: "+ Post a proposal" }), dialog)
  await dialog.getByRole("textbox", { name: "Title" }).fill(title)
  await dialog.getByRole("textbox", { name: "Summary" }).fill("Does pairing help teams ship?")
  await dialog
    .getByRole("textbox", { name: "Body" })
    .fill("We want to compare paired and solo teams.")
  await dialog.getByRole("button", { name: "Publish proposal" }).click()
  await expect(page.getByText("Proposal posted")).toBeVisible()

  await page.getByRole("button", { name: `Actions for ${title}` }).click()
  await page.getByRole("menuitem", { name: "Edit" }).click()
  await page.getByRole("textbox", { name: "Summary" }).fill("Does pairing help teams ship faster?")
  await page.getByRole("button", { name: "Done" }).click()
  await expect(page.getByRole("textbox", { name: "Summary" })).toBeHidden()
  await page.reload()
  await expect(page.getByText("Does pairing help teams ship faster?")).toBeVisible()

  const deleteItem = page.getByRole("menuitem", { name: "Delete" })
  await openWithRetry(page.getByRole("button", { name: `Actions for ${title}` }), deleteItem)
  await deleteItem.click()
  await page.getByRole("button", { name: "Confirm delete" }).click()
  await expect(page).toHaveURL(Routes.PROPOSALS.ROOT)
  await page.reload()
  await expect(page.getByRole("link", { name: title })).toBeHidden()
})
