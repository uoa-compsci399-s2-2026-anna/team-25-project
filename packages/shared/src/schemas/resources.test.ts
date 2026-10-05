import { describe, expect, it } from "vitest"
import {
  RESOURCE_ATTACHMENTS_MAX_BYTES,
  RESOURCE_ATTACHMENTS_MAX_FILES,
  RESOURCE_ATTACHMENTS_MAX_MB,
} from "../constants/resource-attachments"
import { addResourceFormSchema, resourceAttachmentsError } from "./resources"

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
