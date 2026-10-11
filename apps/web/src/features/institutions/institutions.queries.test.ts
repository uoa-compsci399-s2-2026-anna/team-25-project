import { cacheTag } from "next/cache"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { getPayloadClient } from "@/lib/payload/getPayloadClient"
import {
  getInstitution,
  getInstitutionCached,
  getInstitutionName,
  getInstitutionNameCached,
  getInstitutionOptions,
  getInstitutionOptionsCached,
  getInstitutionsWithLogos,
  getInstitutionsWithLogosCached,
} from "./institutions.queries"

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

describe("getInstitutionOptions", () => {
  it("loads every institution by name as select options", async () => {
    find.mockResolvedValue({
      docs: [
        { id: 12, name: "University of Auckland" },
        { id: 3, name: "University of Canterbury" },
      ],
    })

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

  it("is cached under the institutions tag", async () => {
    await expect(getInstitutionOptionsCached()).resolves.toEqual([])
    expect(cacheTag).toHaveBeenCalledWith("institutions")
  })
})

describe("getInstitutionName", () => {
  it("reads only the name of one institution", async () => {
    find.mockResolvedValue({ docs: [{ id: 12, name: "University of Auckland" }] })

    await expect(getInstitutionName(12)).resolves.toEqual({
      id: 12,
      name: "University of Auckland",
    })
    expect(find).toHaveBeenCalledWith({
      collection: "institutions",
      where: { id: { equals: 12 } },
      depth: 0,
      limit: 1,
      pagination: false,
      select: { name: true },
    })
  })

  it("returns null when no institution matches", async () => {
    await expect(getInstitutionName(12)).resolves.toBeNull()
  })

  it("is cached under the institutions tag", async () => {
    await expect(getInstitutionNameCached(12)).resolves.toBeNull()
    expect(cacheTag).toHaveBeenCalledWith("institutions")
  })
})

describe("getInstitution", () => {
  it("reads the whole institution", async () => {
    const institution = { id: 12, name: "University of Auckland", country: "NZ" }
    find.mockResolvedValue({ docs: [institution] })

    await expect(getInstitution(12)).resolves.toEqual(institution)
    expect(find).toHaveBeenCalledWith({
      collection: "institutions",
      where: { id: { equals: 12 } },
      depth: 0,
      limit: 1,
      pagination: false,
    })
  })

  it("returns null when no institution matches", async () => {
    await expect(getInstitution(12)).resolves.toBeNull()
  })

  it("is cached under the institutions tag", async () => {
    await expect(getInstitutionCached(12)).resolves.toBeNull()
    expect(cacheTag).toHaveBeenCalledWith("institutions")
  })
})

describe("getInstitutionsWithLogos", () => {
  it("loads only opted-in institutions that have a logo, sorted by name", async () => {
    await getInstitutionsWithLogos()

    // depth: 1 populates the logo upload so its url and dimensions are available.
    expect(find).toHaveBeenCalledWith({
      collection: "institutions",
      where: { showLogo: { equals: true }, logo: { exists: true } },
      select: { name: true, logo: true },
      depth: 1,
      pagination: false,
      sort: "name",
    })
  })

  it("maps each institution to its name and logo", async () => {
    find.mockResolvedValue({
      docs: [
        {
          id: 12,
          name: "University of Auckland",
          logo: { id: 7, url: "/media/uoa.png", width: 300, height: 150, alt: "UoA" },
        },
      ],
    })

    await expect(getInstitutionsWithLogos()).resolves.toEqual([
      {
        id: 12,
        name: "University of Auckland",
        logo: { id: 7, url: "/media/uoa.png", width: 300, height: 150 },
      },
    ])
  })

  it("skips institutions whose logo is unpopulated, missing, or has no url", async () => {
    find.mockResolvedValue({
      docs: [
        { id: 1, name: "Unpopulated", logo: 7 },
        { id: 2, name: "Missing", logo: null },
        { id: 3, name: "No url", logo: { id: 8, url: null } },
        { id: 4, name: "Shown", logo: { id: 9, url: "/media/shown.png" } },
      ],
    })

    const institutions = await getInstitutionsWithLogos()
    expect(institutions.map(({ name }) => name)).toEqual(["Shown"])
  })

  it("is cached under the institutions tag", async () => {
    await expect(getInstitutionsWithLogosCached()).resolves.toEqual([])
    expect(cacheTag).toHaveBeenCalledWith("institutions")
  })
})
