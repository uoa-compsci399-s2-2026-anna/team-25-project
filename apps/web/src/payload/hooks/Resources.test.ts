import { revalidateTag } from "next/cache"
import type { FieldHook, PayloadRequest } from "payload"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { Slugs } from "@/lib/payload/slugs"
import {
  defaultResourceOwner,
  revalidateAttachmentResources,
  revalidateDeletedAttachmentResources,
  revalidateDeletedResource,
  revalidateResources,
} from "./Resources"

vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }))

const args: Parameters<FieldHook>[0] = {
  blockData: undefined,
  collection: null,
  context: {},
  field: { name: "owner", type: "relationship", relationTo: Slugs.Collections.MEMBERS },
  global: null,
  indexPath: [],
  operation: "create",
  path: [],
  req: { user: null } as PayloadRequest,
  schemaPath: [],
  siblingData: {},
  siblingFields: [],
}

describe("attachment cache revalidation", () => {
  beforeEach(() => {
    vi.mocked(revalidateTag).mockReset()
  })

  it.each([revalidateAttachmentResources, revalidateDeletedAttachmentResources])(
    "marks every resource query stale, as an attachment does not know its resources",
    async (hook) => {
      const doc = { id: 3 }
      const result = await hook({ doc, req: { context: {} } } as never)

      expect(revalidateTag).toHaveBeenCalledExactlyOnceWith("resources", "max")
      expect(result).toBe(doc)
    },
  )

  it.each([revalidateAttachmentResources, revalidateDeletedAttachmentResources])(
    "can skip revalidation through request context",
    async (hook) => {
      await hook({ doc: { id: 3 }, req: { context: { disableRevalidate: true } } } as never)

      expect(revalidateTag).not.toHaveBeenCalled()
    },
  )
})

describe("resource cache revalidation", () => {
  beforeEach(() => {
    vi.mocked(revalidateTag).mockReset()
  })

  it.each([revalidateResources, revalidateDeletedResource])(
    "marks resource queries stale after a write",
    async (hook) => {
      const doc = { id: 1 }
      const result = await hook({
        doc,
        req: { context: {} },
      } as never)

      expect(revalidateTag).toHaveBeenCalledWith("resources", "max")
      expect(revalidateTag).toHaveBeenCalledWith("resources:1", "max")
      expect(result).toBe(doc)
    },
  )

  it.each([revalidateResources, revalidateDeletedResource])(
    "can skip revalidation through request context",
    async (hook) => {
      await hook({
        doc: { id: 1 },
        req: { context: { disableRevalidate: true } },
      } as never)

      expect(revalidateTag).not.toHaveBeenCalled()
    },
  )
})

describe("defaultResourceOwner", () => {
  const req = { user: { id: 42, collection: Slugs.Collections.MEMBERS } } as PayloadRequest

  it.each([undefined, null, 99])("makes the creating member the owner over %j", async (value) => {
    expect(await defaultResourceOwner({ ...args, req, value })).toBe(42)
  })

  it.each(["update", "read", "delete"] as const)(
    "does not change the owner during %s",
    async (operation) => {
      expect(await defaultResourceOwner({ ...args, req, operation, value: 99 })).toBe(99)
    },
  )

  it("lets admins choose the owner", async () => {
    const adminReq = { user: { id: 1, collection: Slugs.Collections.ADMIN } } as PayloadRequest
    expect(await defaultResourceOwner({ ...args, req: adminReq, value: 7 })).toBe(7)
  })

  it("does not choose an owner for an anonymous request", async () => {
    expect(await defaultResourceOwner(args)).toBeUndefined()
  })
})
