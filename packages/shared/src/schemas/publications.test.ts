import { describe, expect, it } from "vitest"
import { PublicationType } from "../enums/publications"
import { addPublicationFormSchema } from "./publications"

const validForm = {
  type: PublicationType.ARTICLE,
  title: "Teamwork in capstone courses",
  authors: [
    { id: "1", kind: "self" },
    { id: "2", kind: "coAuthor", name: "Ben Lee" },
  ],
  year: 2025,
  month: "",
  doi: "10.1145/3313831.3376518",
  url: "",
  venue: "",
  volume: "",
  issue: "",
  pages: "",
  publisher: "",
  citationKey: "",
  abstract: "",
  tags: "",
}

const errorPaths = (input: unknown) => {
  const result = addPublicationFormSchema.safeParse(input)
  return result.success ? [] : result.error.issues.map((issue) => issue.path.join("."))
}

describe("addPublicationFormSchema", () => {
  it("accepts a form with only a URL", () => {
    expect(errorPaths({ ...validForm, doi: "", url: "https://example.com/paper" })).toEqual([])
  })

  it("rejects a form with no DOI and no URL", () => {
    expect(errorPaths({ ...validForm, doi: "", url: "" })).toEqual(["doi", "url"])
  })

  it("accepts a year up to next year", () => {
    const nextYear = new Date().getFullYear() + 1
    expect(errorPaths({ ...validForm, year: nextYear })).toEqual([])
  })

  it("rejects a year after next year", () => {
    const tooLate = new Date().getFullYear() + 2
    expect(errorPaths({ ...validForm, year: tooLate })).toEqual(["year"])
  })

  it("accepts a form with blank optional fields", () => {
    expect(addPublicationFormSchema.safeParse(validForm).success).toBe(true)
  })

  it("accepts a form with no co-authors", () => {
    expect(errorPaths({ ...validForm, authors: [{ id: "3", kind: "self" }] })).toEqual([])
  })

  it("accepts the signed-in member in any position", () => {
    expect(
      errorPaths({
        ...validForm,
        authors: [
          { id: "4", kind: "coAuthor", name: "Ben Lee" },
          { id: "5", kind: "self" },
        ],
      }),
    ).toEqual([])
  })

  it.each([
    ["no", []],
    [
      "two",
      [
        { id: "6", kind: "self" },
        { id: "7", kind: "self" },
      ],
    ],
  ])("rejects %s signed-in member entries", (_, authors) => {
    expect(errorPaths({ ...validForm, authors })).toEqual(["authors"])
  })

  it("requires a title and co-author names", () => {
    expect(
      errorPaths({
        ...validForm,
        title: " ",
        authors: [
          { id: "8", kind: "self" },
          { id: "9", kind: "coAuthor", name: "" },
        ],
      }),
    ).toEqual(["title", "authors.1.name"])
  })

  it.each([999, 10000, 2025.5])("rejects year %s", (year) => {
    expect(errorPaths({ ...validForm, year })).toEqual(["year"])
  })

  it.each(["0", "13", "x"])("rejects month %s", (month) => {
    expect(errorPaths({ ...validForm, month })).toEqual(["month"])
  })

  it("accepts a valid DOI, URL and month", () => {
    expect(
      errorPaths({
        ...validForm,
        doi: "10.1145/3313831.3376518",
        month: "12",
        url: "https://example.com/paper",
      }),
    ).toEqual([])
  })

  it("rejects a DOI that does not start with 10.", () => {
    expect(errorPaths({ ...validForm, doi: "https://doi.org/10.1145/1" })).toEqual(["doi"])
  })

  it("rejects a URL that is not a full URL", () => {
    expect(errorPaths({ ...validForm, url: "example" })).toEqual(["url"])
  })

  it.each([
    "javascript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "ftp://example.com/paper",
  ])("rejects the non-web URL %s", (url) => {
    expect(errorPaths({ ...validForm, url })).toEqual(["url"])
  })

  it("says the year is required when the year input is empty", () => {
    const result = addPublicationFormSchema.safeParse({ ...validForm, year: Number.NaN })
    expect(result.error?.issues.map((issue) => issue.message)).toEqual(["Year is required"])
  })
})
