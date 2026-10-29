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
import { Admin } from "./Admin"
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

  it("lets only completeProfile or an admin set registrationCompletedAt", () => {
    const field = Members.fields.find(
      (candidate) => "name" in candidate && candidate.name === "registrationCompletedAt",
    )
    const access = field && "access" in field ? field.access : undefined
    const update = (req: object) => access?.update?.({ req } as never)
    expect(access?.create?.({ req: { context: {}, user: { collection: "admin" } } } as never)).toBe(
      false,
    )
    expect(update({ context: {} })).toBe(false)
    expect(update({ context: {}, user: { collection: "members" } })).toBe(false)
    expect(update({ context: { completingRegistration: true } })).toBe(true)
    expect(update({ context: {}, user: { collection: "admin" } })).toBe(true)
  })

  it("lets only an admin unlock a member or admin account", () => {
    for (const collection of [Members, Admin]) {
      const unlock = (req: object) => collection.access?.unlock?.({ req } as never)
      expect(unlock({})).toBe(false)
      expect(unlock({ user: { collection: "members" } })).toBe(false)
      expect(unlock({ user: { collection: "admin" } })).toBe(true)
    }
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
