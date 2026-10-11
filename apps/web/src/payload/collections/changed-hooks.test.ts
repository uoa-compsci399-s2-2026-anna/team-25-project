import { describe, expect, it } from "vitest"
import { revalidateDeletedInstitution, revalidateInstitutions } from "../hooks/Institutions"
import {
  assertMemberDeletable,
  enforceInstitutionDomain,
  revalidateDeletedMemberProposals,
  revalidateMemberProposals,
} from "../hooks/Members"
import { revalidateDeletedProposal, revalidateProposals } from "../hooks/Proposals"
import {
  requireLinkedAuthor,
  revalidateDeletedPublication,
  revalidatePublications,
} from "../hooks/Publications"
import {
  revalidateAttachmentResources,
  revalidateDeletedAttachmentResources,
  revalidateDeletedResource,
  revalidateResources,
} from "../hooks/Resources"
import { Institutions } from "./Institutions"
import { Members } from "./Members"
import { Proposals } from "./Proposals"
import { Publications } from "./Publications"
import { ResourceAttachments } from "./ResourceAttachments"
import { Resources } from "./Resources"

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
      beforeDelete: [assertMemberDeletable],
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

  it("registers publication validation and cache invalidation", () => {
    expect(Publications.hooks).toEqual({
      afterChange: [revalidatePublications],
      afterDelete: [revalidateDeletedPublication],
      beforeChange: [requireLinkedAuthor],
    })
  })

  it("registers resource cache invalidation", () => {
    expect(Resources.hooks).toEqual({
      afterChange: [revalidateResources],
      afterDelete: [revalidateDeletedResource],
    })
  })

  it("registers resource cache invalidation on attachments", () => {
    expect(ResourceAttachments.hooks).toEqual({
      afterChange: [revalidateAttachmentResources],
      afterDelete: [revalidateDeletedAttachmentResources],
    })
  })
})
