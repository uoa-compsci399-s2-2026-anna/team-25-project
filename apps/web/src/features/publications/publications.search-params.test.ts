import { PublicationType } from "@repo/shared/enums/publications"
import { describe, expect, it } from "vitest"
import {
  loadPublicationSearchParams,
  serializePublicationSearchParams,
  toPublicationFilters,
} from "./publications.search-params"

describe("loadPublicationSearchParams", () => {
  it("falls back to defaults when the URL has no params", () => {
    expect(loadPublicationSearchParams("")).toEqual({
      page: 1,
      q: "",
      sort: "newest",
      tags: [],
      type: null,
      year: null,
    })
  })

  it("parses every param", () => {
    expect(
      loadPublicationSearchParams(
        "?q=capstone&type=phdthesis&year=2024&tags=Teamwork,Code%20review&sort=titleAsc&page=3",
      ),
    ).toEqual({
      page: 3,
      q: "capstone",
      sort: "titleAsc",
      tags: ["Teamwork", "Code review"],
      type: PublicationType.PHD_THESIS,
      year: 2024,
    })
  })

  it("ignores values it does not recognise", () => {
    expect(loadPublicationSearchParams("?type=poster&year=soon&sort=random")).toMatchObject({
      sort: "newest",
      type: null,
      year: null,
    })
  })

  it.each(["0", "-1", "2abc", "1.5", "abc"])("falls back for a page or year of %s", (value) => {
    expect(loadPublicationSearchParams(`?page=${value}&year=${value}`)).toMatchObject({
      page: 1,
      year: null,
    })
  })

  it("falls back for a page too large for the database", () => {
    expect(loadPublicationSearchParams("?page=99999999999999999999999999").page).toBe(1)
    expect(loadPublicationSearchParams("?page=1000000000").page).toBe(1)
    expect(loadPublicationSearchParams("?page=999999999").page).toBe(999999999)
  })

  it.each(["999", "10000", "99999999999"])("falls back for a year of %s", (value) => {
    expect(loadPublicationSearchParams(`?year=${value}`).year).toBeNull()
  })

  it.each([
    ["1000", 1000],
    ["9999", 9999],
  ])("accepts a year of %s", (value, year) => {
    expect(loadPublicationSearchParams(`?year=${value}`).year).toBe(year)
  })
})

describe("serializePublicationSearchParams", () => {
  it("keeps every filter in the URL", () => {
    expect(
      serializePublicationSearchParams("/publications", {
        page: 3,
        q: "capstone",
        sort: "titleAsc",
        tags: ["Teamwork", "Code review"],
        type: PublicationType.PHD_THESIS,
        year: 2024,
      }),
    ).toBe(
      "/publications?q=capstone&type=phdthesis&year=2024&tags=Teamwork,Code+review&sort=titleAsc&page=3",
    )
  })

  it("leaves out default values, such as page 1", () => {
    expect(
      serializePublicationSearchParams("/publications", {
        page: 1,
        q: "",
        sort: "newest",
        tags: [],
        type: null,
        year: null,
      }),
    ).toBe("/publications")
  })
})

describe("toPublicationFilters", () => {
  it("maps params to query filters", () => {
    expect(
      toPublicationFilters({
        page: 2,
        q: "  capstone  ",
        sort: "oldest",
        tags: ["Teamwork"],
        type: PublicationType.ARTICLE,
        year: 2024,
      }),
    ).toEqual({
      search: "capstone",
      sort: "oldest",
      tags: ["Teamwork"],
      type: PublicationType.ARTICLE,
      year: 2024,
    })
  })

  it("drops empty values", () => {
    expect(
      toPublicationFilters({ page: 1, q: "   ", sort: "newest", tags: [], type: null, year: null }),
    ).toEqual({
      search: undefined,
      sort: "newest",
      tags: undefined,
      type: undefined,
      year: undefined,
    })
  })

  it("drops empty tags", () => {
    expect(toPublicationFilters(loadPublicationSearchParams("?tags=,")).tags).toBeUndefined()
    expect(toPublicationFilters(loadPublicationSearchParams("?tags=Teamwork,,%20")).tags).toEqual([
      "Teamwork",
    ])
  })
})
