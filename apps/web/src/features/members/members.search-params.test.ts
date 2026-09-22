import { InstitutionCountry } from "@repo/shared/enums/institutions"
import { describe, expect, it } from "vitest"
import {
  loadMemberSearchParams,
  serializeMemberSearchParams,
  toMemberFilters,
} from "./members.search-params"

describe("loadMemberSearchParams", () => {
  it("falls back to defaults when the URL has no params", () => {
    expect(loadMemberSearchParams("")).toEqual({
      country: null,
      institution: null,
      page: 1,
      q: "",
      sort: "surnameAsc",
    })
  })

  it("parses every param", () => {
    expect(
      loadMemberSearchParams("?q=tui&institution=12&country=NZ&sort=surnameDesc&page=3"),
    ).toEqual({
      country: InstitutionCountry.NZ,
      institution: 12,
      page: 3,
      q: "tui",
      sort: "surnameDesc",
    })
  })

  it("ignores values it does not recognise", () => {
    expect(loadMemberSearchParams("?institution=abc&country=FR&sort=random&page=0")).toEqual({
      country: null,
      institution: null,
      page: 1,
      q: "",
      sort: "surnameAsc",
    })
  })

  it("rejects an institution id that is not a positive integer", () => {
    expect(loadMemberSearchParams("?institution=0")).toMatchObject({ institution: null })
    expect(loadMemberSearchParams("?institution=-3")).toMatchObject({ institution: null })
    expect(loadMemberSearchParams("?institution=2abc")).toMatchObject({ institution: null })
  })
})

describe("serializeMemberSearchParams", () => {
  it("leaves defaults out of the URL", () => {
    expect(serializeMemberSearchParams("/members", { q: "", sort: "surnameAsc" })).toBe("/members")
  })

  it("keeps the params that differ from their defaults", () => {
    expect(
      serializeMemberSearchParams("/members", {
        country: InstitutionCountry.NZ,
        institution: 12,
      }),
    ).toBe("/members?institution=12&country=NZ")
  })

  it("carries the filters onto a page link, and leaves page 1 implicit", () => {
    const params = { country: InstitutionCountry.NZ, institution: 12, q: "tui" }

    expect(serializeMemberSearchParams("/members", { ...params, page: 3 })).toBe(
      "/members?q=tui&institution=12&country=NZ&page=3",
    )
    expect(serializeMemberSearchParams("/members", { ...params, page: 1 })).toBe(
      "/members?q=tui&institution=12&country=NZ",
    )
  })
})

describe("toMemberFilters", () => {
  it("drops cleared filters and trims the search", () => {
    expect(
      toMemberFilters({
        country: null,
        institution: null,
        page: 2,
        q: "  tui  ",
        sort: "surnameAsc",
      }),
    ).toEqual({
      country: undefined,
      institutionId: undefined,
      search: "tui",
      sort: "surnameAsc",
    })
  })

  it("treats a whitespace-only search as no search", () => {
    expect(
      toMemberFilters({ country: null, institution: null, page: 1, q: "   ", sort: "surnameAsc" }),
    ).toMatchObject({ search: undefined })
  })

  it("carries every set filter through", () => {
    expect(
      toMemberFilters({
        country: InstitutionCountry.AU,
        institution: 7,
        page: 4,
        q: "anna",
        sort: "surnameDesc",
      }),
    ).toEqual({
      country: InstitutionCountry.AU,
      institutionId: 7,
      search: "anna",
      sort: "surnameDesc",
    })
  })
})
