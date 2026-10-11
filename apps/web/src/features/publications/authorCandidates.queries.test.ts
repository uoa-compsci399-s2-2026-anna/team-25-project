import { beforeEach, describe, expect, it, vi } from "vitest"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { getPayloadClient } from "@/lib/payload/getPayloadClient"
import { getOtherAuthorCandidates } from "./authorCandidates.queries"

vi.mock("next/cache", () => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }))
vi.mock("@/lib/payload/getCurrentUser", () => ({ getCurrentUser: vi.fn() }))
vi.mock("@/lib/payload/getPayloadClient", () => ({ getPayloadClient: vi.fn() }))

const find = vi.fn()

const signInAs = (collection: "members" | "admin" | null, id = 1) =>
  vi
    .mocked(getCurrentUser)
    .mockResolvedValue(
      (collection ? { collection, user: { id } } : { collection: null, user: null }) as Awaited<
        ReturnType<typeof getCurrentUser>
      >,
    )

const memberDoc = (id: number, firstName: string) => ({
  id,
  firstName,
  lastName: "Lee",
  position: "Lecturer",
  institution: { name: "University of Auckland" },
  avatar: { url: `/media/${id}.png` },
  email: `${firstName}@example.com`,
})

describe("getOtherAuthorCandidates", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    find.mockResolvedValue({ docs: [memberDoc(1, "Ann"), memberDoc(2, "Ben")] })
    vi.mocked(getPayloadClient).mockResolvedValue({ find } as unknown as Awaited<
      ReturnType<typeof getPayloadClient>
    >)
  })

  it.each([["admin"], [null]] as const)("returns null for a %s user", async (collection) => {
    signInAs(collection)
    expect(await getOtherAuthorCandidates()).toBeNull()
    expect(find).not.toHaveBeenCalled()
  })

  it("leaves out the signed-in member and returns only the fields the picker shows", async () => {
    signInAs("members", 1)

    expect(await getOtherAuthorCandidates()).toEqual([
      {
        id: 2,
        firstName: "Ben",
        lastName: "Lee",
        position: "Lecturer",
        institution: "University of Auckland",
        avatarUrl: "/media/2.png",
      },
    ])
    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({
        select: {
          firstName: true,
          lastName: true,
          position: true,
          institution: true,
          avatar: true,
        },
      }),
    )
  })
})
