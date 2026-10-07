import { describe, expect, it } from "vitest"
import {
  loadResourceSearchParams,
  serializeResourceSearchParams,
  toResourceFilters,
} from "./resources.search-params"

describe("loadResourceSearchParams", () => {
  it("falls back to defaults when the URL has no params", () => {
    expect(loadResourceSearchParams("")).toEqual({
      course: null,
      institution: null,
      page: 1,
      q: "",
      sort: "newest",
    })
  })

  it("parses every param", () => {
    expect(
      loadResourceSearchParams("?q=rubric&course=4&institution=12&sort=titleAsc&page=3"),
    ).toEqual({
      course: 4,
      institution: 12,
      page: 3,
      q: "rubric",
      sort: "titleAsc",
    })
  })

  it("ignores a sort it does not recognise", () => {
    expect(loadResourceSearchParams("?sort=random").sort).toBe("newest")
  })

  it.each(["0", "-1", "2abc", "1.5", "abc"])("falls back for an id or page of %s", (value) => {
    expect(
      loadResourceSearchParams(`?course=${value}&institution=${value}&page=${value}`),
    ).toMatchObject({ course: null, institution: null, page: 1 })
  })
})

describe("serializeResourceSearchParams", () => {
  it("leaves defaults out of the URL", () => {
    expect(
      serializeResourceSearchParams("/resources", {
        course: null,
        institution: null,
        page: 1,
        q: "",
        sort: "newest",
      }),
    ).toBe("/resources")
  })

  it("keeps the filters alongside the page", () => {
    expect(serializeResourceSearchParams("/resources", { course: 4, page: 2, q: "rubric" })).toBe(
      "/resources?q=rubric&course=4&page=2",
    )
  })
})

describe("toResourceFilters", () => {
  it("maps the params onto query filters", () => {
    expect(
      toResourceFilters({ course: 4, institution: 12, page: 3, q: "  rubric  ", sort: "oldest" }),
    ).toEqual({ courseId: 4, institutionId: 12, search: "rubric", sort: "oldest" })
  })

  it("drops unset filters and a blank search", () => {
    expect(
      toResourceFilters({ course: null, institution: null, page: 1, q: "   ", sort: "newest" }),
    ).toEqual({ courseId: undefined, institutionId: undefined, search: undefined, sort: "newest" })
  })
})
