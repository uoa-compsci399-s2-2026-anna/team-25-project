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
    expect(Members.access?.read?.({} as never)).toBe(true)
  })

  it("lets only a verified registration or an admin create a member", () => {
    const create = (req: object) => Members.access?.create?.({ req } as never)
    expect(create({ context: {} })).toBe(false)
    expect(create({ context: {}, user: { collection: "members" } })).toBe(false)
    expect(create({ context: { registeringVerifiedMember: true } })).toBe(true)
    expect(create({ context: {}, user: { collection: "admin" } })).toBe(true)
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
