import { describe, expect, it } from "vitest"
import { PublicationType } from "../enums/publications"
import { addPublicationFormSchema, createPublicationSchema } from "./publications"

const validForm = {
  type: PublicationType.ARTICLE,
  title: "Teamwork in capstone courses",
  authors: [
    { id: "1", kind: "self" },
    { id: "2", kind: "coAuthor", name: "Ben Lee" },
  ],
  year: 2025,
  month: "",
  doi: "",
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

describe("createPublicationSchema", () => {
  it("accepts a minimal valid publication", () => {
    expect(
      createPublicationSchema.safeParse({
        type: PublicationType.ARTICLE,
        title: "Title",
        authors: [{ name: "Anna Smith", member: 1 }],
        year: 2025,
      }).success,
    ).toBe(true)
  })

  it("requires at least one author", () => {
    expect(
      createPublicationSchema.safeParse({
        type: PublicationType.ARTICLE,
        title: "Title",
        authors: [],
        year: 2025,
      }).success,
    ).toBe(false)
  })
})

describe("addPublicationFormSchema", () => {
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
})
