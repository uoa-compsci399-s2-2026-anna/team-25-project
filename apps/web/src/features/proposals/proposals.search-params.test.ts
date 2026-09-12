import { ProposalStatus, ProposalTag } from "@repo/shared/enums/proposals"
import { describe, expect, it } from "vitest"
import { loadProposalSearchParams, toProposalFilters } from "./proposals.search-params"

describe("loadProposalSearchParams", () => {
  it("falls back to defaults when the URL has no params", () => {
    expect(loadProposalSearchParams("")).toEqual({
      institution: null,
      page: 1,
      q: "",
      sort: "newest",
      status: ProposalStatus.ACTIVE,
      tag: null,
    })
  })

  it("parses every param", () => {
    expect(
      loadProposalSearchParams(
        "?status=closed&q=peer&institution=12&tag=assessment&sort=oldest&page=3",
      ),
    ).toEqual({
      institution: 12,
      page: 3,
      q: "peer",
      sort: "oldest",
      status: ProposalStatus.CLOSED,
      tag: ProposalTag.ASSESSMENT,
    })
  })

  it("ignores values it does not recognise", () => {
    expect(
      loadProposalSearchParams("?status=foo&institution=abc&tag=nope&sort=random"),
    ).toMatchObject({
      institution: null,
      sort: "newest",
      status: ProposalStatus.ACTIVE,
      tag: null,
    })
  })

  it.each(["0", "-1", "2abc", "1.5", "abc"])("falls back for a page or id of %s", (value) => {
    expect(loadProposalSearchParams(`?page=${value}&institution=${value}`)).toMatchObject({
      institution: null,
      page: 1,
    })
  })
})

describe("toProposalFilters", () => {
  it("maps params to query filters", () => {
    expect(
      toProposalFilters({
        institution: 12,
        page: 1,
        q: "  peer  ",
        sort: "oldest",
        status: ProposalStatus.CLOSED,
        tag: ProposalTag.ASSESSMENT,
      }),
    ).toEqual({
      institutionId: 12,
      search: "peer",
      sort: "oldest",
      status: ProposalStatus.CLOSED,
      tag: ProposalTag.ASSESSMENT,
    })
  })

  it("drops the status filter for all, and empty values", () => {
    expect(
      toProposalFilters({
        institution: null,
        page: 1,
        q: "   ",
        sort: "newest",
        status: "all",
        tag: null,
      }),
    ).toEqual({
      institutionId: undefined,
      search: undefined,
      sort: "newest",
      status: undefined,
      tag: undefined,
    })
  })
})
