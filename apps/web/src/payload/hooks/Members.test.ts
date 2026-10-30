import { mockInstitution } from "@repo/shared/mocks/institution"
import type { Institution, Member } from "@repo/shared/payload-types"
import { revalidateTag } from "next/cache"
import { Forbidden, type PayloadRequest, ValidationError } from "payload"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { Slugs } from "@/lib/payload/slugs"
import {
  allowPasswordChangesFromAppOnly,
  assertMemberDeletable,
  enforceInstitutionDomain,
  normaliseStoredInterests,
  refuseIdentityChangesFromMembers,
  refuseSortByEmail,
  revalidateDeletedMemberProposals,
  revalidateMemberProposals,
} from "./Members"

vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }))

describe("member cache revalidation", () => {
  beforeEach(() => {
    vi.mocked(revalidateTag).mockReset()
  })

  it.each([revalidateMemberProposals, revalidateDeletedMemberProposals])(
    "marks proposal and profile queries stale after a write",
    async (hook) => {
      const doc = { id: 1 }
      const result = await hook({ doc, req: { context: {} } } as never)

      expect(revalidateTag).toHaveBeenCalledWith("proposals", "max")
      expect(revalidateTag).toHaveBeenCalledWith("members", "max")
      expect(revalidateTag).toHaveBeenCalledWith("member:1", "max")
      expect(result).toBe(doc)
    },
  )

  it.each([revalidateMemberProposals, revalidateDeletedMemberProposals])(
    "can skip revalidation through request context",
    async (hook) => {
      await hook({ doc: { id: 1 }, req: { context: { disableRevalidate: true } } } as never)

      expect(revalidateTag).not.toHaveBeenCalled()
    },
  )
})

type HookArgs = Parameters<typeof enforceInstitutionDomain>[0]

// Builds fake hook args with a stubbed req.payload.findByID, so these stay
// unit tests of the domain-matching logic - no live Payload/Postgres needed.
const makeArgs = (
  data: Partial<Member>,
  findByIDResult: Institution | null = null,
  context: HookArgs["req"]["context"] = {},
) => {
  const findByID = vi.fn().mockResolvedValue(findByIDResult)
  const args = { data, req: { context, payload: { findByID } } } as unknown as HookArgs
  return { args, findByID }
}

describe("enforceInstitutionDomain", () => {
  it("skips the check when the write asks it to", async () => {
    const { args, findByID } = makeArgs({ email: "student@gone.ac.nz", institution: 1 }, null, {
      skipDomainCheck: true,
    })
    await expect(enforceInstitutionDomain(args)).resolves.toEqual(args.data)
    expect(findByID).not.toHaveBeenCalled()
  })

  it("skips the check when email is missing, leaving required-field validation to reject it", async () => {
    const { args, findByID } = makeArgs({ institution: 1 })
    await expect(enforceInstitutionDomain(args)).resolves.toEqual(args.data)
    expect(findByID).not.toHaveBeenCalled()
  })

  it("skips the check when institution is missing, leaving required-field validation to reject it", async () => {
    const { args, findByID } = makeArgs({ email: "student@auckland.ac.nz" })
    await expect(enforceInstitutionDomain(args)).resolves.toEqual(args.data)
    expect(findByID).not.toHaveBeenCalled()
  })

  it("does not fall back to a stale value when email is explicitly cleared", async () => {
    const { args, findByID } = makeArgs({
      email: null,
      institution: 1,
    } as unknown as Partial<Member>)
    await expect(enforceInstitutionDomain(args)).resolves.toEqual(args.data)
    expect(findByID).not.toHaveBeenCalled()
  })

  it("throws when the selected institution does not exist", async () => {
    const { args } = makeArgs({ email: "student@auckland.ac.nz", institution: 999 }, null)
    const result = enforceInstitutionDomain(args)
    await expect(result).rejects.toBeInstanceOf(ValidationError)
    await expect(result).rejects.toMatchObject({
      status: 400,
      data: { errors: [{ path: "institution" }] },
    })
  })

  it("allows an exact domain match", async () => {
    const institution = mockInstitution()
    const { args } = makeArgs(
      { email: "student@auckland.ac.nz", institution: institution.id },
      institution,
    )
    await expect(enforceInstitutionDomain(args)).resolves.toEqual(args.data)
  })

  it("allows a subdomain of a registered domain", async () => {
    const institution = mockInstitution()
    const { args } = makeArgs(
      { email: "student@cs.auckland.ac.nz", institution: institution.id },
      institution,
    )
    await expect(enforceInstitutionDomain(args)).resolves.toEqual(args.data)
  })

  it("rejects a lookalike domain that merely ends with the registered domain", async () => {
    const institution = mockInstitution()
    const { args } = makeArgs(
      { email: "student@notauckland.ac.nz", institution: institution.id },
      institution,
    )
    const result = enforceInstitutionDomain(args)
    await expect(result).rejects.toBeInstanceOf(ValidationError)
    await expect(result).rejects.toMatchObject({
      status: 400,
      data: { errors: [{ path: "email" }] },
    })
  })

  it("rejects an email domain with no relation to any registered domain", async () => {
    const institution = mockInstitution()
    const { args } = makeArgs(
      { email: "student@gmail.com", institution: institution.id },
      institution,
    )
    await expect(enforceInstitutionDomain(args)).rejects.toMatchObject({
      status: 400,
      data: { errors: [{ path: "email" }] },
    })
  })

  it("matches domains case-insensitively", async () => {
    const institution = mockInstitution({
      domains: [{ domain: "Auckland.AC.NZ" }],
    })
    const { args } = makeArgs(
      { email: "Student@AUCKLAND.ac.nz", institution: institution.id },
      institution,
    )
    await expect(enforceInstitutionDomain(args)).resolves.toEqual(args.data)
  })

  it("tolerates surrounding whitespace on both the email and the stored domain", async () => {
    const institution = mockInstitution({ domains: [{ domain: "  auckland.ac.nz  " }] })
    const { args } = makeArgs(
      { email: "student@auckland.ac.nz  ", institution: institution.id },
      institution,
    )
    await expect(enforceInstitutionDomain(args)).resolves.toEqual(args.data)
  })

  it("extracts the id when institution arrives as an already-populated relationship object", async () => {
    const institution = mockInstitution()
    const { args, findByID } = makeArgs(
      { email: "student@auckland.ac.nz", institution },
      institution,
    )
    await enforceInstitutionDomain(args)
    expect(findByID).toHaveBeenCalledWith(expect.objectContaining({ id: institution.id }))
  })
})

describe("normaliseStoredInterests", () => {
  it("stores interests trimmed, without blanks or repeats", () => {
    expect(
      normaliseStoredInterests({
        value: ["  Teamwork  ", "", "Teamwork", "Ethics"],
      } as never),
    ).toEqual(["Teamwork", "Ethics"])
  })

  it.each([null, undefined])("leaves %s alone", (value) => {
    expect(normaliseStoredInterests({ value } as never)).toBe(value)
  })
})

describe("assertMemberDeletable", () => {
  const remove = (totalDocs: number) => {
    const count = vi.fn().mockResolvedValue({ totalDocs })
    const req = { payload: { count } } as unknown as PayloadRequest
    const result = assertMemberDeletable({ id: 42, req } as unknown as Parameters<
      typeof assertMemberDeletable
    >[0])
    return { count, result }
  }

  it("counts the member's resources regardless of who is asking", async () => {
    const { count, result } = remove(0)
    await result
    expect(count).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: Slugs.Collections.RESOURCES,
        where: { owner: { equals: 42 } },
        overrideAccess: true,
      }),
    )
  })

  it("allows a member with no resources", async () => {
    await expect(remove(0).result).resolves.toBeUndefined()
  })

  it.each([
    [1, "This member owns 1 resource."],
    [3, "This member owns 3 resources."],
  ])("refuses a member who owns %i, asking for them to be dealt with first", async (n, message) => {
    await expect(remove(n).result).rejects.toThrow(`${message} Delete or reassign them first.`)
    await expect(remove(n).result).rejects.toMatchObject({ status: 409 })
  })
})

describe("allowPasswordChangesFromAppOnly", () => {
  const run = (operation: string, payloadAPI: PayloadRequest["payloadAPI"]) =>
    allowPasswordChangesFromAppOnly({
      args: { data: {} },
      operation,
      req: { payloadAPI, t: () => "" },
    } as never)

  it.each(["forgotPassword", "resetPassword"])(
    "refuses %s through REST or GraphQL, which would skip the app's limits",
    (operation) => {
      expect(() => run(operation, "REST")).toThrow(Forbidden)
      expect(() => run(operation, "GraphQL")).toThrow(Forbidden)
    },
  )

  it.each(["forgotPassword", "resetPassword"])("lets the app's own %s through", (operation) => {
    expect(run(operation, "local")).toEqual({ data: {} })
  })

  it("leaves other operations alone", () => {
    expect(run("login", "REST")).toEqual({ data: {} })
  })

  const update = (data: object, user: object | null, payloadAPI: PayloadRequest["payloadAPI"]) =>
    allowPasswordChangesFromAppOnly({
      args: { data },
      operation: "update",
      req: { payloadAPI, t: () => "", user },
    } as never)

  const memberUser = { id: 1, collection: "members" }

  it("refuses a member setting a password through REST, which needs no old password", () => {
    expect(() => update({ password: "new" }, memberUser, "REST")).toThrow(Forbidden)
  })

  it("lets an admin set a member's password from the admin panel", () => {
    const adminUser = { id: 1, collection: "admin" }
    expect(update({ password: "new" }, adminUser, "REST")).toEqual({ data: { password: "new" } })
  })

  it("leaves updates without a password alone", () => {
    expect(update({ bio: "hi" }, memberUser, "REST")).toEqual({ data: { bio: "hi" } })
  })
})

describe("refuseIdentityChangesFromMembers", () => {
  const update = (data: object, user: object | null, payloadAPI = "REST") =>
    refuseIdentityChangesFromMembers({
      args: { data },
      operation: "update",
      req: { payloadAPI, t: () => "", user },
    } as never)

  const memberUser = { id: 1, collection: "members" }

  it.each([{ email: "a@auckland.ac.nz" }, { institution: 2 }])(
    "refuses a member changing %o through REST",
    (data) => {
      expect(() => update(data, memberUser)).toThrow(Forbidden)
    },
  )

  it("lets an admin change a member's email", () => {
    const adminUser = { id: 1, collection: "admin" }
    expect(update({ email: "a@auckland.ac.nz" }, adminUser)).toEqual({
      data: { email: "a@auckland.ac.nz" },
    })
  })

  it("leaves other updates and the app's own calls alone", () => {
    expect(update({ bio: "hi" }, memberUser)).toEqual({ data: { bio: "hi" } })
    expect(update({ email: "a@auckland.ac.nz" }, memberUser, "local")).toEqual({
      data: { email: "a@auckland.ac.nz" },
    })
  })
})

describe("refuseSortByEmail", () => {
  const run = (sort: unknown, user: object | null = null, payloadAPI = "REST") =>
    refuseSortByEmail({
      args: { sort },
      operation: "read",
      req: { payloadAPI, user },
    } as never)

  it.each([
    "email",
    "-email",
    "firstName,email",
    "authors.member.email",
    "authors__member__email",
    "-authors__member__email",
    ["lastName", "-email"],
  ])("refuses a REST sort by email: %s", (sort) => {
    expect(() => run(sort)).toThrow("Sorting by email is not allowed.")
  })

  it("refuses a signed-in member too", () => {
    expect(() => run("email", { id: 1, collection: "members" })).toThrow(
      "Sorting by email is not allowed.",
    )
  })

  it("lets an admin and the app's own queries sort by email", () => {
    expect(run("email", { id: 1, collection: "admin" })).toEqual({ sort: "email" })
    expect(run("email", null, "local")).toEqual({ sort: "email" })
  })

  it("leaves other sorts alone", () => {
    expect(run("-lastName,emailOptIn")).toEqual({ sort: "-lastName,emailOptIn" })
    expect(run(undefined)).toEqual({ sort: undefined })
  })
})
