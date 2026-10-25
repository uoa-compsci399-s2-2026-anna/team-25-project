import { describe, expect, it } from "vitest"
import {
  RESOURCE_ATTACHMENTS_MAX_BYTES,
  RESOURCE_ATTACHMENTS_MAX_FILES,
  RESOURCE_ATTACHMENTS_MAX_MB,
} from "../constants/resource-attachments"
import {
  addResourceFormSchema,
  resourceAttachmentsEditSchema,
  resourceAttachmentsError,
  updateResourceSchema,
} from "./resources"

const description = (text: string) => ({
  root: {
    type: "root",
    children: [{ type: "paragraph", version: 1, children: text ? [{ type: "text", text }] : [] }],
    direction: null,
    format: "" as const,
    indent: 0,
    version: 1,
  },
})

const valid = { course: 4, description: description("Rubric with notes."), title: "Rubric" }

const pdf = (name = "rubric.pdf", size = 1024) => ({ name, size, type: "application/pdf" })

describe("addResourceFormSchema", () => {
  it("accepts a resource with or without a course", () => {
    expect(addResourceFormSchema.safeParse(valid).success).toBe(true)
    expect(addResourceFormSchema.safeParse({ ...valid, course: null }).success).toBe(true)
  })

  it("trims the title", () => {
    expect(addResourceFormSchema.parse({ ...valid, title: "  Rubric  " }).title).toBe("Rubric")
  })

  it.each([
    ["a blank title", { title: "   " }, "Title is required"],
    ["an empty description", { description: description("") }, "Description is required"],
  ])("refuses %s", (_label, overrides, message) => {
    const result = addResourceFormSchema.safeParse({ ...valid, ...overrides })
    expect(result.error?.issues[0]?.message).toBe(message)
  })
})

describe("updateResourceSchema", () => {
  it("accepts any subset of the fields, so a left-out field is kept as is", () => {
    expect(updateResourceSchema.safeParse({}).success).toBe(true)
    expect(updateResourceSchema.parse({ title: " New title " })).toEqual({ title: "New title" })
  })

  it("accepts a course id, or null to unlink it", () => {
    expect(updateResourceSchema.parse({ course: 4 })).toEqual({ course: 4 })
    expect(updateResourceSchema.parse({ course: null })).toEqual({ course: null })
  })

  it.each([0, -1, 1.5, "4"])("refuses a course that isn't an id (%o)", (course) => {
    expect(updateResourceSchema.safeParse({ course }).success).toBe(false)
  })

  it.each([
    [{ title: "  " }, "Title is required"],
    [{ description: description("") }, "Description is required"],
  ])("still refuses an emptied field (%o)", (input, message) => {
    expect(updateResourceSchema.safeParse(input).error?.issues[0]?.message).toBe(message)
  })
})

describe("resourceAttachmentsError", () => {
  it("accepts no attachments, or supported ones within the limits", () => {
    expect(resourceAttachmentsError([])).toBeUndefined()
    expect(resourceAttachmentsError([pdf(), pdf("notes.pdf")])).toBeUndefined()
  })

  it("refuses too many files", () => {
    const files = Array.from({ length: RESOURCE_ATTACHMENTS_MAX_FILES + 1 }, (_, i) =>
      pdf(`file-${i}.pdf`),
    )
    expect(resourceAttachmentsError(files)).toBe(
      `Attach at most ${RESOURCE_ATTACHMENTS_MAX_FILES} files.`,
    )
  })

  it("counts the files already linked toward the file cap", () => {
    expect(resourceAttachmentsError([pdf()], RESOURCE_ATTACHMENTS_MAX_FILES - 1)).toBeUndefined()
    expect(resourceAttachmentsError([pdf()], RESOURCE_ATTACHMENTS_MAX_FILES)).toBe(
      `Attach at most ${RESOURCE_ATTACHMENTS_MAX_FILES} files.`,
    )
  })

  it("names an empty file", () => {
    expect(resourceAttachmentsError([pdf(), pdf("blank.pdf", 0)])).toBe(
      "blank.pdf is empty. Remove it or attach the file again.",
    )
  })

  it("names a file of an unsupported type", () => {
    expect(
      resourceAttachmentsError([pdf(), { name: "page.html", size: 10, type: "text/html" }]),
    ).toMatch(/^page\.html isn't a supported file type/)
  })

  it("refuses files that are too large together", () => {
    const half = RESOURCE_ATTACHMENTS_MAX_BYTES / 2
    expect(resourceAttachmentsError([pdf("a.pdf", half), pdf("b.pdf", half)])).toBeUndefined()
    expect(resourceAttachmentsError([pdf("a.pdf", half), pdf("b.pdf", half + 1)])).toBe(
      `Attachments must be ${RESOURCE_ATTACHMENTS_MAX_MB} MB or smaller in total.`,
    )
  })
})

describe("resourceAttachmentsEditSchema", () => {
  const file = (name = "rubric.pdf", type = "application/pdf") =>
    new File(["%PDF-1.4"], name, { type })

  it("accepts saved ids to keep and new files to add", () => {
    const value = { add: [file()], keep: [4, 5] }
    expect(resourceAttachmentsEditSchema.parse(value)).toEqual(value)
    expect(updateResourceSchema.parse({ attachments: value })).toEqual({ attachments: value })
  })

  it.each([0, -1, 1.5, "4"])("refuses a kept id that isn't an id (%o)", (id) => {
    expect(resourceAttachmentsEditSchema.safeParse({ add: [], keep: [id] }).success).toBe(false)
  })

  it("refuses an added value that isn't a file", () => {
    const add = [{ name: "rubric.pdf", size: 8, type: "application/pdf" }]
    expect(resourceAttachmentsEditSchema.safeParse({ add, keep: [] }).success).toBe(false)
  })

  it("refuses new files with the attachments message, counting the kept ones", () => {
    const keep = Array.from({ length: RESOURCE_ATTACHMENTS_MAX_FILES }, (_, i) => i + 1)
    expect(
      resourceAttachmentsEditSchema.safeParse({ add: [file()], keep }).error?.issues[0]?.message,
    ).toBe(`Attach at most ${RESOURCE_ATTACHMENTS_MAX_FILES} files.`)
    expect(
      resourceAttachmentsEditSchema.safeParse({ add: [file("page.html", "text/html")], keep: [] })
        .error?.issues[0]?.message,
    ).toMatch(/^page\.html isn't a supported file type/)
  })
})
