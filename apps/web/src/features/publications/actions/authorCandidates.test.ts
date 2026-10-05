import { beforeEach, describe, expect, it, vi } from "vitest"
import { getOtherAuthorCandidates } from "../authorCandidates.queries"
import { matchBibtexAuthors } from "./matchBibtexAuthors"
import { searchAuthorCandidates } from "./searchAuthorCandidates"

vi.mock("../authorCandidates.queries", () => ({ getOtherAuthorCandidates: vi.fn() }))

const member = (id: number, firstName: string, lastName: string) => ({
  id,
  firstName,
  lastName,
  position: "Lecturer",
})

const janeSmith = member(2, "Jane", "Smith")
const johnSmith = member(3, "John", "Smith")
const benLee = member(4, "Ben", "Lee")

describe("author candidate actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getOtherAuthorCandidates).mockResolvedValue([janeSmith, johnSmith, benLee])
  })

  describe("searchAuthorCandidates", () => {
    it("finds members by initials or part of a name", async () => {
      expect(await searchAuthorCandidates("J. Smith")).toEqual([janeSmith, johnSmith])
      expect(await searchAuthorCandidates("smi")).toEqual([janeSmith, johnSmith])
    })

    it("returns nothing to a non-member", async () => {
      vi.mocked(getOtherAuthorCandidates).mockResolvedValue(null)
      expect(await searchAuthorCandidates("Ben")).toEqual([])
    })
  })

  describe("matchBibtexAuthors", () => {
    it("links a name only when exactly one member fits", async () => {
      expect(
        await matchBibtexAuthors([
          { given: ["b"], family: "lee" },
          { given: ["j"], family: "smith" },
          { given: ["cara"], family: "ngata" },
        ]),
      ).toEqual([benLee, null, null])
    })
  })
})
