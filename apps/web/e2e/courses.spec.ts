import { expect, type Locator, type Page, test } from "@playwright/test"
import { Routes } from "@/lib/routes"
import { ADMIN_STORAGE_STATE, MEMBER_STORAGE_STATE } from "./auth-state"
import { gotoHydrated, uniqueTitle } from "./helpers"

test.use({ storageState: MEMBER_STORAGE_STATE })

const DRAFT_PERIOD = "Semester 1 2027"

/** Fills what a draft leaves out. Course name and code are already set. */
async function fillPublishFields(page: Page, dialog: Locator) {
  await dialog.getByRole("textbox", { name: "Course program" }).fill("Software Engineering")
  await dialog.getByRole("textbox", { name: "Teaching period" }).fill("Semester 2 2026")
  await dialog.getByRole("textbox", { name: "Start date" }).fill("2026-07-13")
  await dialog.getByRole("textbox", { name: "End date" }).fill("2026-10-30")
  await dialog.getByRole("combobox", { name: "Delivery format" }).click()
  await page.getByRole("option", { name: "In person" }).click()
  await dialog.getByRole("textbox", { name: "Project type" }).fill("Industry client project")
  await dialog.getByRole("textbox", { name: "Learning outcomes" }).fill("Ship software as a team.")
  await dialog.getByRole("textbox", { name: "Assessments" }).fill("Final demo and report.")
}

/** Opens the add course dialog with a new name and code. Codes are unique per institution. */
async function startCourse(page: Page) {
  const course = { name: uniqueTitle("Software Studio"), code: uniqueTitle("SOFTENG") }
  await gotoHydrated(page, Routes.COURSES.ROOT)
  await page.getByRole("button", { name: "+ Add your course" }).click()
  const dialog = page.getByRole("dialog", { name: "Add a capstone course" })
  await dialog.getByRole("textbox", { name: "Course name" }).fill(course.name)
  await dialog.getByRole("textbox", { name: "Course code" }).fill(course.code)
  return { course, dialog }
}

/** Publishes a new course and opens its page. */
async function publishCourse(page: Page) {
  const { course, dialog } = await startCourse(page)
  await fillPublishFields(page, dialog)
  await dialog.getByRole("button", { name: "Publish" }).click()
  await expect(dialog).toBeHidden()
  await page.getByRole("link", { name: course.name }).first().click()
  await expect(page.getByRole("heading", { level: 1 })).toContainText(course.code)
  return course
}

/** Saves a new course as a draft and reopens it from the courses table. */
async function openNewDraftCourse(page: Page) {
  const { course, dialog } = await startCourse(page)
  await dialog.getByRole("button", { name: "Save draft" }).click()
  await expect(dialog).toBeHidden()
  await page.getByRole("row", { name: new RegExp(course.code) }).click()
  return { course, draftDialog: page.getByRole("dialog", { name: "Edit draft course" }) }
}

/** Publishes a course, saves a new offering on it as a draft, and reopens the draft. */
async function openNewDraftOffering(page: Page) {
  await publishCourse(page)
  await page.getByRole("button", { name: "+ Add offering" }).click()
  const addDialog = page.getByRole("dialog", { name: "Add an offering" })
  await addDialog.getByRole("textbox", { name: "Teaching period" }).fill(DRAFT_PERIOD)
  await addDialog.getByRole("button", { name: "Save draft" }).click()
  await expect(addDialog).toBeHidden()
  // The "Draft saved" toast covers the draft dialog's buttons until it closes. It stays
  // open while hovered, and the pointer is still where "Save draft" was.
  await page.mouse.move(0, 0)
  await expect(page.getByRole("heading", { name: "Draft saved" })).toBeHidden({ timeout: 10_000 })

  await page.getByRole("button", { name: new RegExp(DRAFT_PERIOD) }).click()
  // The draft's dialog has no accessible name, and toasts are dialogs too.
  return page
    .getByRole("dialog")
    .filter({ has: page.getByRole("textbox", { name: "Teaching period" }) })
}

test("a member publishes a course and opens it", async ({ page }) => {
  await publishCourse(page)
})

test("a member saves a course as a draft, then publishes it", async ({ page }) => {
  const { course, draftDialog } = await openNewDraftCourse(page)

  await fillPublishFields(page, draftDialog)
  await draftDialog.getByRole("button", { name: "Publish" }).click()

  await expect(draftDialog).toBeHidden()
  await page.getByRole("link", { name: course.name }).first().click()
  await expect(page.getByRole("heading", { level: 1 })).toContainText(course.code)
})

test("a member deletes a draft course", async ({ page }) => {
  const { course, draftDialog } = await openNewDraftCourse(page)

  await draftDialog.getByRole("button", { name: "Delete draft" }).click()
  await draftDialog.getByRole("button", { name: "Confirm delete" }).click()

  await expect(page.getByText("Draft deleted")).toBeVisible()
  await expect(page.getByRole("row", { name: new RegExp(course.code) })).toBeHidden()
})

test("an owner adds, edits and deletes an offering", async ({ page }) => {
  await publishCourse(page)

  await page.getByRole("button", { name: "+ Add offering" }).click()
  const addDialog = page.getByRole("dialog", { name: "Add an offering" })
  await addDialog.getByRole("textbox", { name: "Teaching period" }).fill("Semester 1 2027")
  await addDialog.getByRole("textbox", { name: "Start date" }).fill("2027-03-01")
  await addDialog.getByRole("textbox", { name: "End date" }).fill("2027-06-11")
  await addDialog.getByRole("button", { name: "Publish" }).click()
  await expect(addDialog).toBeHidden()

  await page.getByRole("button", { name: "Edit offering" }).click()
  const editDialog = page.getByRole("dialog", { name: "Edit offering" })
  await editDialog.getByRole("textbox", { name: "Project type" }).fill("Research project")
  await editDialog.getByRole("button", { name: "Save changes" }).click()
  await expect(editDialog).toBeHidden()
  await expect(page.getByText("Research project")).toBeVisible()

  await page.getByRole("button", { name: "Delete offering" }).click()
  await page.getByRole("button", { name: "Confirm delete" }).click()
  await expect(page.getByText("Offering deleted")).toBeVisible()
})

test("an owner saves an offering as a draft, then publishes it", async ({ page }) => {
  const draftDialog = await openNewDraftOffering(page)
  await draftDialog.getByRole("textbox", { name: "Start date" }).fill("2027-03-01")
  await draftDialog.getByRole("textbox", { name: "End date" }).fill("2027-06-11")
  await draftDialog.getByRole("button", { name: "Publish" }).click()

  await expect(draftDialog).toBeHidden()
  await expect(page.getByRole("button", { name: new RegExp(DRAFT_PERIOD) })).toBeHidden()
})

test("an owner deletes a draft offering", async ({ page }) => {
  const draftDialog = await openNewDraftOffering(page)
  await draftDialog.getByRole("button", { name: "Delete draft" }).click()
  await draftDialog.getByRole("button", { name: "Confirm delete" }).click()

  await expect(page.getByText("Draft deleted")).toBeVisible()
  await expect(page.getByRole("button", { name: new RegExp(DRAFT_PERIOD) })).toBeHidden()
})

test("an admin deletes a course", async ({ page, browser }) => {
  const course = await publishCourse(page)
  const coursePath = new URL(page.url()).pathname

  const adminContext = await browser.newContext({ storageState: ADMIN_STORAGE_STATE })
  const adminPage = await adminContext.newPage()
  await gotoHydrated(adminPage, coursePath)
  await adminPage.getByRole("button", { name: "Delete course" }).click()
  await adminPage.getByRole("button", { name: "Confirm delete" }).click()

  await expect(adminPage).toHaveURL(Routes.COURSES.ROOT)
  await expect(adminPage.getByRole("link", { name: course.name })).toBeHidden()
  await adminContext.close()
})
