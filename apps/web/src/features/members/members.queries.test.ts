import { InstitutionCountry } from "@repo/shared/enums/institutions"
import { connection } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { getPayloadClient } from "@/lib/payload/getPayloadClient"
import { getMemberCounts, getMembers } from "./members.queries"

vi.mock("@/lib/payload/getPayloadClient", () => ({ getPayloadClient: vi.fn() }))
// The real one throws outside a request scope, which a unit test has no way to enter.
vi.mock("next/server", () => ({ connection: vi.fn() }))

const find = vi.fn()
const count = vi.fn()

const selectedFields = {
  avatar: true,
  firstName: true,
  institution: true,
  lastName: true,
  position: true,
}

beforeEach(() => {
  find.mockReset()
  count.mockReset()
  vi.mocked(connection).mockClear()
  vi.mocked(getPayloadClient).mockResolvedValue({ count, find } as unknown as Awaited<
    ReturnType<typeof getPayloadClient>
  >)
})

describe("request-time deferral", () => {
  // Without it, cacheComponents prerenders the query and trips over Payload's transaction id.
  it("defers to request time before querying", async () => {
    count.mockResolvedValue({ totalDocs: 0 })

    await getMembers({ country: InstitutionCountry.NZ }, { limit: 12, page: 1 })
    expect(connection).toHaveBeenCalled()

    await getMemberCounts({})
    expect(connection).toHaveBeenCalledTimes(2)
  })
})

describe("getMembers", () => {
  it("applies every member filter", async () => {
    await getMembers(
      {
        country: InstitutionCountry.NZ,
        institutionId: 12,
        search: "  tui  ",
        sort: "surnameDesc",
      },
      { limit: 12, page: 2 },
    )

    expect(find).toHaveBeenCalledWith({
      collection: "members",
      depth: 1,
      limit: 12,
      page: 2,
      select: selectedFields,
      sort: "-lastName",
      where: {
        and: [{ or: [{ firstName: { contains: "tui" } }, { lastName: { contains: "tui" } }] }],
        institution: { equals: 12 },
        "institution.country": { equals: InstitutionCountry.NZ },
      },
    })
  })

  it("returns the whole directory by surname when no filters are set", async () => {
    await getMembers({}, { limit: 12, page: 1 })

    expect(find).toHaveBeenCalledWith({
      collection: "members",
      depth: 1,
      limit: 12,
      page: 1,
      select: selectedFields,
      sort: "lastName",
      where: {},
    })
  })

  it("matches one search term against either name", async () => {
    await getMembers({ search: "anna" }, { limit: 12, page: 1 })

    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          and: [{ or: [{ firstName: { contains: "anna" } }, { lastName: { contains: "anna" } }] }],
        },
      }),
    )
  })

  it("requires every word of a full name to match, across the two fields", async () => {
    await getMembers({ search: "Priya  Nair" }, { limit: 12, page: 1 })

    // One `contains` over the whole string can never match, since neither field holds both words.
    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          and: [
            { or: [{ firstName: { contains: "Priya" } }, { lastName: { contains: "Priya" } }] },
            { or: [{ firstName: { contains: "Nair" } }, { lastName: { contains: "Nair" } }] },
          ],
        },
      }),
    )
  })

  it("asks only for the fields the card draws, leaving gated ones behind", async () => {
    await getMembers({}, { limit: 12, page: 1 })

    const { select } = find.mock.lastCall?.[0] ?? {}
    expect(select).toEqual(selectedFields)
    expect(select).not.toHaveProperty("email")
    expect(select).not.toHaveProperty("bio")
  })
})

describe("getMemberCounts", () => {
  it("counts the filtered members against the whole directory", async () => {
    count.mockResolvedValueOnce({ totalDocs: 8 }).mockResolvedValueOnce({ totalDocs: 124 })

    await expect(getMemberCounts({ country: InstitutionCountry.NZ })).resolves.toEqual({
      shown: 8,
      total: 124,
    })

    expect(count).toHaveBeenNthCalledWith(1, {
      collection: "members",
      where: { "institution.country": { equals: InstitutionCountry.NZ } },
    })
    expect(count).toHaveBeenNthCalledWith(2, { collection: "members" })
  })

  it("reports the same number twice when nothing is filtered", async () => {
    count.mockResolvedValue({ totalDocs: 124 })

    await expect(getMemberCounts({})).resolves.toEqual({ shown: 124, total: 124 })
  })
})
