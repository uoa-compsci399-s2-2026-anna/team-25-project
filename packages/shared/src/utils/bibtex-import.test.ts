import { describe, expect, it } from "vitest"
import { PublicationType } from "../enums/publications"
import { parseBibtexImport, SELF_NOT_FOUND_WARNING } from "./bibtex-import"

const self = { firstName: "Mikai", lastName: "Somerville" }

const authorNames = (result: ReturnType<typeof parseBibtexImport>) =>
  result.authors?.map((author) => (author.kind === "self" ? "<self>" : author.name))

const texts = (result: ReturnType<typeof parseBibtexImport>, level: string) =>
  result.messages.filter((message) => message.level === level).map((message) => message.text)

describe("parseBibtexImport", () => {
  it("maps a full entry to form values", () => {
    const result = parseBibtexImport(
      String.raw`@InProceedings{smith2024learning,
        author = {M{\"u}ller, J{\"o}rg and Somerville, Mikai},
        title = {Learning {BibTeX} with \textit{Style}: A \& B},
        booktitle = {Proc. of CHI},
        year = 2024, month = mar,
        volume = {12}, number = {3}, pages = {123--145},
        publisher = {ACM},
        doi = {https://doi.org/10.1145/3313831.3376518},
        url = {https://example.com/paper},
        abstract = {We \emph{show} things.},
        keywords = {Assessment; Teamwork, peer review}
      }`,
      self,
    )

    expect(result.values).toEqual({
      type: PublicationType.IN_PROCEEDINGS,
      citationKey: "smith2024learning",
      title: "Learning BibTeX with Style: A & B",
      year: 2024,
      month: "3",
      venue: "Proc. of CHI",
      volume: "12",
      issue: "3",
      pages: "123-145",
      publisher: "ACM",
      doi: "10.1145/3313831.3376518",
      url: "https://example.com/paper",
      abstract: "We show things.",
      tags: expect.stringContaining("Assessment"),
    })
    expect(result.values.tags?.split(", ").sort()).toEqual([
      "Assessment",
      "Teamwork",
      "peer review",
    ])
    expect(authorNames(result)).toEqual(["Jörg Müller", "<self>"])
    expect(result.filledCount).toBe(15)
    expect(result.messages).toEqual([])
  })

  it.each([
    ["article", PublicationType.ARTICLE],
    ["PhdThesis", PublicationType.PHD_THESIS],
    ["conference", PublicationType.IN_PROCEEDINGS],
    ["thesis", PublicationType.PHD_THESIS],
    ["report", PublicationType.TECH_REPORT],
    ["online", PublicationType.MISC],
  ])("maps @%s to %s", (type, expected) => {
    const result = parseBibtexImport(`@${type}{k, title={T}}`, self)
    expect(result.values.type).toBe(expected)
    expect(texts(result, "info")).toEqual([])
  })

  it("maps an unknown type to misc with a hint", () => {
    const result = parseBibtexImport("@dataset{k, title={T}}", self)
    expect(result.values.type).toBe(PublicationType.MISC)
    expect(texts(result, "info")).toEqual([
      "The type @dataset is not supported, so we set the type to Other.",
    ])
  })

  describe("self author", () => {
    it.each([
      ["full name", "Mikai Somerville"],
      ["last, first", "Somerville, Mikai"],
      ["initial", "Somerville, M."],
      ["initial and middle name", "M. J. Somerville"],
      ["different case and accents", "MIKAI Sómerville"],
    ])("matches by %s", (_, name) => {
      const result = parseBibtexImport(
        `@article{k, title={T}, year={2020}, author={Ann Lee and ${name}}}`,
        self,
      )
      expect(authorNames(result)).toEqual(["Ann Lee", "<self>"])
      expect(texts(result, "warning")).toEqual([])
    })

    it("does not match a different first name with the same last name", () => {
      const result = parseBibtexImport("@article{k, title={T}, author={Sam Somerville}}", self)
      expect(authorNames(result)).toEqual(["<self>", "Sam Somerville"])
    })

    it("adds the member first with a warning when they are not found", () => {
      const result = parseBibtexImport(
        "@article{k, title={T}, year={2020}, author={Ann Lee and Bo Chen}}",
        self,
      )
      expect(authorNames(result)).toEqual(["<self>", "Ann Lee", "Bo Chen"])
      expect(texts(result, "warning")).toEqual([SELF_NOT_FOUND_WARNING])
    })

    it("matches only the first of two matching names", () => {
      const result = parseBibtexImport(
        "@article{k, title={T}, author={M. Somerville and Mikai Somerville}}",
        self,
      )
      expect(result.authors?.filter((author) => author.kind === "self")).toHaveLength(1)
    })
  })

  it("formats prefixes, suffixes and organisations", () => {
    const result = parseBibtexImport(
      "@article{k, title={T}, author={van der Berg, Anna and Smith, Jr., John and {World Health Organization} and Mikai Somerville}}",
      self,
    )
    expect(authorNames(result)).toEqual([
      "Anna van der Berg",
      "John Smith Jr.",
      "World Health Organization",
      "<self>",
    ])
  })

  it('drops "and others" with a hint', () => {
    const result = parseBibtexImport(
      "@article{k, title={T}, author={Mikai Somerville and others}}",
      self,
    )
    expect(authorNames(result)).toEqual(["<self>"])
    expect(texts(result, "info")).toEqual([
      'The author list ends with "and others". Add the missing authors.',
    ])
  })

  it("uses editors when there are no authors", () => {
    const result = parseBibtexImport("@book{k, title={T}, editor={Mikai Somerville}}", self)
    expect(authorNames(result)).toEqual(["<self>"])
    expect(texts(result, "info")).toEqual(["The entry has no authors, so we used the editors."])
  })

  it("leaves authors unset when the entry has none", () => {
    const result = parseBibtexImport("@misc{k, title={T}}", self)
    expect(result.authors).toBeUndefined()
  })

  it.each([
    ["month = {September}", "9"],
    ["month = sep", "9"],
    ["month = {11}", "11"],
    ["date = {2023-07-01}", "7"],
  ])("reads %s as month %s", (field, month) => {
    const result = parseBibtexImport(`@article{k, title={T}, year={2023}, ${field}}`, self)
    expect(result.values.month).toBe(month)
    expect(result.values.year).toBe(2023)
  })

  it("reads the year from a biblatex date", () => {
    const result = parseBibtexImport("@article{k, title={T}, date={2021}}", self)
    expect(result.values.year).toBe(2021)
    expect(result.values.month).toBeUndefined()
  })

  it("warns about a year it cannot read", () => {
    const result = parseBibtexImport("@article{k, title={T}, year={in press}}", self)
    expect(result.values.year).toBeUndefined()
    expect(texts(result, "warning")).toEqual([
      'Could not read the year "in press". Check the year.',
    ])
  })

  it("warns when the year is missing", () => {
    const result = parseBibtexImport("@article{k, title={T}}", self)
    expect(result.values.year).toBeUndefined()
    expect(texts(result, "warning")).toEqual(["The entry has no year. Check the year."])
  })

  it("prefers year and month over date", () => {
    const result = parseBibtexImport(
      "@article{k, title={T}, year={2020}, month={feb}, date={2019-05}}",
      self,
    )
    expect(result.values.year).toBe(2020)
    expect(result.values.month).toBe("2")
    expect(texts(result, "info")).toEqual([])
  })

  it.each(["doi:10.1000/xyz", "https://dx.doi.org/10.1000/xyz", "http://doi.org/10.1000/xyz"])(
    "removes the prefix from %s",
    (doi) => {
      const result = parseBibtexImport(`@article{k, title={T}, doi={${doi}}}`, self)
      expect(result.values.doi).toBe("10.1000/xyz")
    },
  )

  it("warns about a DOI that does not look correct", () => {
    const result = parseBibtexImport("@article{k, title={T}, year={2020}, doi={not-a-doi}}", self)
    expect(result.values.doi).toBe("not-a-doi")
    expect(texts(result, "warning")).toEqual([
      'The DOI "not-a-doi" does not look correct. Check it.',
    ])
  })

  it.each(["javascript:alert(1)", "example.com/paper"])("warns about the URL %s", (url) => {
    const result = parseBibtexImport(`@article{k, title={T}, year={2020}, url={${url}}}`, self)
    expect(result.values.url).toBe(url)
    expect(texts(result, "warning")).toEqual([`The URL "${url}" does not look correct. Check it.`])
  })

  it("warns about LaTeX commands it could not read and keeps their argument", () => {
    const result = parseBibtexImport(
      String.raw`@article{k, title={A \foo{bar} \unknowncmd b}, year={2020}}`,
      self,
    )
    expect(result.values.title).toBe("A bar b")
    expect(texts(result, "warning")).toEqual([
      String.raw`Some LaTeX commands could not be read and were removed: \foo, \unknowncmd. Check the fields.`,
    ])
  })

  it("picks the venue from the first available field", () => {
    const thesis = parseBibtexImport("@phdthesis{k, title={T}, school={UoA}}", self)
    expect(thesis.values.venue).toBe("UoA")
    const article = parseBibtexImport(
      "@article{k, title={T}, journaltitle={J}, organization={Org}}",
      self,
    )
    expect(article.values.venue).toBe("J")
  })

  it("lists fields that were not imported", () => {
    const result = parseBibtexImport("@article{k, title={T}, isbn={123}, note={hi}}", self)
    expect(texts(result, "info")).toEqual(["Not imported: isbn, note."])
  })

  it("warns when the title is missing", () => {
    const result = parseBibtexImport("@article{k, year={2020}}", self)
    expect(result.values.title).toBeUndefined()
    expect(texts(result, "warning")).toEqual(["The entry has no title. Add one."])
  })

  it("imports only the first of many entries", () => {
    const result = parseBibtexImport("@article{a, title={First}} @article{b, title={Second}}", self)
    expect(result.values.title).toBe("First")
    expect(texts(result, "info")).toEqual(["Only the first entry was imported."])
  })

  it("imports a partly readable entry with a warning", () => {
    const result = parseBibtexImport("@article{k, title={T}, year={2020}, number=4", self)
    expect(result.values.title).toBe("T")
    expect(texts(result, "warning")).toEqual([
      "Part of the BibTeX could not be read. Check the fields below.",
    ])
  })

  it.each(["garbage {", "@article", "just some text"])("returns an error for %j", (text) => {
    const result = parseBibtexImport(text, self)
    expect(result.values).toEqual({})
    expect(result.authors).toBeUndefined()
    expect(result.filledCount).toBe(0)
    expect(texts(result, "error")).toHaveLength(1)
  })

  it("puts warnings before hints", () => {
    const result = parseBibtexImport("@dataset{k, author={Ann Lee}, year={2020}, isbn={1}}", self)
    expect(result.messages.map((message) => message.level)).toEqual([
      "warning",
      "warning",
      "info",
      "info",
    ])
  })
})
