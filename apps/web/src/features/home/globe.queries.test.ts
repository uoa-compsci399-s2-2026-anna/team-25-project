import { QueryKeys } from "@repo/shared/constants/query-keys"
import { cacheTag } from "next/cache"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { getPayloadClient } from "@/lib/payload/getPayloadClient"
import { Slugs } from "@/lib/payload/slugs"
import { getInstitutionMarkers, getInstitutionMarkersCached } from "./globe.queries"

vi.mock("@/lib/payload/getPayloadClient", () => ({ getPayloadClient: vi.fn() }))
vi.mock("next/cache", () => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }))

const find = vi.fn()

beforeEach(() => {
  find.mockReset().mockResolvedValue({ docs: [] })
  vi.mocked(cacheTag).mockReset()
  vi.mocked(getPayloadClient).mockResolvedValue({
    find,
  } as unknown as Awaited<ReturnType<typeof getPayloadClient>>)
})

describe("getInstitutionMarkers", () => {
  it("reads only the name and location of every institution", async () => {
    await getInstitutionMarkers()
    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: Slugs.Collections.INSTITUTIONS,
        pagination: false,
        select: { location: true, name: true },
      }),
    )
  })

  it("maps each institution to a [lat, lng] globe marker", async () => {
    find.mockResolvedValue({
      docs: [
        { id: 3, name: "University of Otago", location: { latitude: -45.87, longitude: 170.51 } },
      ],
    })
    expect(await getInstitutionMarkers()).toEqual([
      { id: "institution-3", location: [-45.87, 170.51], label: "University of Otago" },
    ])
  })
})

describe("getInstitutionMarkersCached", () => {
  it("tags the cache so institution changes revalidate the globe", async () => {
    await getInstitutionMarkersCached()
    expect(cacheTag).toHaveBeenCalledWith(QueryKeys.INSTITUTIONS)
  })
})
