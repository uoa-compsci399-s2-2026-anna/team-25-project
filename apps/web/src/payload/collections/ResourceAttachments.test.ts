import type { PayloadRequest } from "payload"
import { describe, expect, it } from "vitest"
import { Slugs } from "@/lib/payload/slugs"
import { ResourceAttachments } from "./ResourceAttachments"

const mimeTypes = ResourceAttachments.upload
const access = ResourceAttachments.access

describe("ResourceAttachments collection", () => {
  it.each(["image/svg+xml", "text/html"])("refuses %s, which can carry a script", (mimeType) => {
    expect(mimeTypes).toMatchObject({ mimeTypes: expect.not.arrayContaining([mimeType]) })
  })

  it("accepts PDFs", () => {
    expect(mimeTypes).toMatchObject({ mimeTypes: expect.arrayContaining(["application/pdf"]) })
  })

  it("hides attachments from visitors who aren't signed in", async () => {
    expect(await access?.read?.({ req: { user: null } as PayloadRequest })).toBe(false)
  })

  it("lets a signed-in member upload", async () => {
    const req = { user: { id: 1, collection: Slugs.Collections.MEMBERS } } as PayloadRequest
    expect(await access?.create?.({ req })).toBe(true)
  })

  it.each(["update", "delete"] as const)("keeps %s with admins", async (operation) => {
    const member = { user: { id: 1, collection: Slugs.Collections.MEMBERS } } as PayloadRequest
    const admin = { user: { id: 1, collection: Slugs.Collections.ADMIN } } as PayloadRequest
    expect(await access?.[operation]?.({ req: member })).toBe(false)
    expect(await access?.[operation]?.({ req: admin })).toBe(true)
  })
})
