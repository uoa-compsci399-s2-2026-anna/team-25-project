import { describe, expect, it, vi } from "vitest"
import { getPayloadClient } from "@/lib/payload/getPayloadClient"
import { getInstitutionOptions } from "./institutions.queries"

vi.mock("@/lib/payload/getPayloadClient", () => ({ getPayloadClient: vi.fn() }))

describe("getInstitutionOptions", () => {
  it("loads every institution by name as select options", async () => {
    const find = vi.fn().mockResolvedValue({
      docs: [
        { id: 12, name: "University of Auckland" },
        { id: 3, name: "University of Canterbury" },
      ],
    })
    vi.mocked(getPayloadClient).mockResolvedValue({
      find,
    } as unknown as Awaited<ReturnType<typeof getPayloadClient>>)

    await expect(getInstitutionOptions()).resolves.toEqual([
      { label: "University of Auckland", value: 12 },
      { label: "University of Canterbury", value: 3 },
    ])
    // Without pagination: false, Payload returns only the first 10.
    expect(find).toHaveBeenCalledWith({
      collection: "institutions",
      pagination: false,
      select: { name: true },
      sort: "name",
    })
  })
})
