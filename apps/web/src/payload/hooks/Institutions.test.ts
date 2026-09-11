import { revalidateTag } from "next/cache"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { revalidateDeletedInstitution, revalidateInstitutions } from "./Institutions"

vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }))

describe("institution cache revalidation", () => {
  beforeEach(() => {
    vi.mocked(revalidateTag).mockReset()
  })

  it.each([revalidateInstitutions, revalidateDeletedInstitution])(
    "marks institution and proposal queries stale after a write",
    async (hook) => {
      const doc = { id: 1 }
      const result = await hook({ doc, req: { context: {} } } as never)

      expect(revalidateTag).toHaveBeenCalledWith("institutions", "max")
      expect(revalidateTag).toHaveBeenCalledWith("proposals", "max")
      expect(result).toBe(doc)
    },
  )

  it.each([revalidateInstitutions, revalidateDeletedInstitution])(
    "can skip revalidation through request context",
    async (hook) => {
      await hook({ doc: { id: 1 }, req: { context: { disableRevalidate: true } } } as never)

      expect(revalidateTag).not.toHaveBeenCalled()
    },
  )
})
