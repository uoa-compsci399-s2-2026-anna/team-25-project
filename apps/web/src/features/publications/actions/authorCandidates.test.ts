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
      expect(await searchAuthorCandidates("J. Smith")).toEqual({
        ok: true,
        members: [janeSmith, johnSmith],
      })
      expect(await searchAuthorCandidates("smi")).toEqual({
        ok: true,
        members: [janeSmith, johnSmith],
      })
    })

    it("puts name matches before members whose name only contains the text", async () => {
      const benLeeson = member(5, "Ben", "Leeson")
      vi.mocked(getOtherAuthorCandidates).mockResolvedValue([benLeeson, benLee])
      expect(await searchAuthorCandidates("Ben Lee")).toEqual({
        ok: true,
        members: [benLee, benLeeson],
      })
    })

    it("returns at most eight members, each once", async () => {
      const smiths = Array.from({ length: 10 }, (_, i) => member(10 + i, `Sam${i}`, "Smith"))
      vi.mocked(getOtherAuthorCandidates).mockResolvedValue(smiths)
      const result = await searchAuthorCandidates("Smith")
      expect(result).toEqual({ ok: true, members: smiths.slice(0, 8) })
    })

    it.each([[""], ["   "], ["x".repeat(201)], [42]])("finds nothing for %j", async (query) => {
      expect(await searchAuthorCandidates(query)).toEqual({ ok: true, members: [] })
    })

    it("refuses a non-member", async () => {
      vi.mocked(getOtherAuthorCandidates).mockResolvedValue(null)
      expect(await searchAuthorCandidates("Ben")).toEqual({ ok: false })
    })
  })

  describe("matchBibtexAuthors", () => {
    it("links a name that fits exactly one member", async () => {
      expect(
        await matchBibtexAuthors([
          { given: ["b"], family: "lee" },
          { given: ["cara"], family: "ngata" },
        ]),
      ).toEqual({ ok: true, matches: [benLee, null] })
    })

    it("does not link a name that fits two members", async () => {
      expect(await matchBibtexAuthors([{ given: ["j"], family: "smith" }])).toEqual({
        ok: true,
        matches: [null],
      })
    })

    it("still matches the other names when one name is not valid", async () => {
      expect(
        await matchBibtexAuthors([
          { given: ["b"], family: "x".repeat(201) },
          { given: ["b"], family: "lee" },
        ]),
      ).toEqual({ ok: true, matches: [null, benLee] })
    })

    it("returns no matches for no names", async () => {
      expect(await matchBibtexAuthors([])).toEqual({ ok: true, matches: [] })
    })

    it.each([
      ["not an array", "lee"],
      ["too many names", Array(501).fill({ given: [], family: "" })],
    ])("refuses %s", async (_, names) => {
      expect(await matchBibtexAuthors(names)).toEqual({ ok: false })
    })

    it("refuses a non-member", async () => {
      vi.mocked(getOtherAuthorCandidates).mockResolvedValue(null)
      expect(await matchBibtexAuthors([{ given: ["b"], family: "lee" }])).toEqual({ ok: false })
    })
  })
})
