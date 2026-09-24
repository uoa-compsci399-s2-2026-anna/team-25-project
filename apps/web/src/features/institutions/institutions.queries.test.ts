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
