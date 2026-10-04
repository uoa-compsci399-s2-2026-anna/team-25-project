import { describe, expect, it } from "vitest"
import { resourceAttachmentTypeLabel } from "./resource-attachments"

describe("resourceAttachmentTypeLabel", () => {
  it.each([
    ["application/pdf", "PDF"],
    ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "Word document"],
    ["text/csv", "CSV"],
  ])("labels %s as %s", (mimeType, label) => {
    expect(resourceAttachmentTypeLabel(mimeType)).toBe(label)
  })

  it.each([["text/html"], [null], [undefined], [""]])("has no label for %s", (mimeType) => {
    expect(resourceAttachmentTypeLabel(mimeType)).toBeUndefined()
  })
})
