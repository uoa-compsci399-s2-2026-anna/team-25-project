import { describe, expect, it } from "vitest"
import { revalidateDeletedInstitution, revalidateInstitutions } from "../hooks/Institutions"
import {
  enforceInstitutionDomain,
  revalidateDeletedMemberProposals,
  revalidateMemberProposals,
} from "../hooks/Members"
import { revalidateDeletedProposal, revalidateProposals } from "../hooks/Proposals"
import { Institutions } from "./Institutions"
import { Members } from "./Members"
import { Proposals } from "./Proposals"

describe("changed collection hooks", () => {
  it("registers institution cache invalidation", () => {
    expect(Institutions.hooks).toEqual({
      afterChange: [revalidateInstitutions],
      afterDelete: [revalidateDeletedInstitution],
    })
    expect(Institutions.access?.read?.({} as never)).toBe(true)
  })

  it("registers member validation and proposal invalidation", () => {
    expect(Members.hooks).toEqual({
      afterChange: [revalidateMemberProposals],
      afterDelete: [revalidateDeletedMemberProposals],
      beforeValidate: [enforceInstitutionDomain],
    })
    expect(Members.access?.create?.({} as never)).toBe(true)
    expect(Members.access?.read?.({} as never)).toBe(true)
  })

  it("registers proposal cache invalidation", () => {
    expect(Proposals.hooks).toEqual({
      afterChange: [revalidateProposals],
      afterDelete: [revalidateDeletedProposal],
    })
  })
})
