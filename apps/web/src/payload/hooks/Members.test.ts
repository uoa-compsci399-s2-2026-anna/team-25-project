import type { Institution, Member } from "@repo/shared/payload-types"
import { ValidationError } from "payload"
import { describe, expect, it, vi } from "vitest"
import { enforceInstitutionDomain } from "./Members"

type HookArgs = Parameters<typeof enforceInstitutionDomain>[0]

const makeInstitution = (overrides: Partial<Institution> = {}): Institution => ({
  id: 1,
  name: "University of Auckland",
  country: "NZ",
  domains: [{ domain: "auckland.ac.nz" }],
  updatedAt: "",
  createdAt: "",
  ...overrides,
})

// Builds fake hook args with a stubbed req.payload.findByID, so these stay
// unit tests of the domain-matching logic - no live Payload/Postgres needed.
const makeArgs = (data: Partial<Member>, findByIDResult: Institution | null = null) => {
  const findByID = vi.fn().mockResolvedValue(findByIDResult)
  const args = { data, req: { payload: { findByID } } } as unknown as HookArgs
  return { args, findByID }
}

describe("enforceInstitutionDomain", () => {
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
    const institution = makeInstitution()
    const { args } = makeArgs(
      { email: "student@auckland.ac.nz", institution: institution.id },
      institution,
    )
    await expect(enforceInstitutionDomain(args)).resolves.toEqual(args.data)
  })

  it("allows a subdomain of a registered domain", async () => {
    const institution = makeInstitution()
    const { args } = makeArgs(
      { email: "student@cs.auckland.ac.nz", institution: institution.id },
      institution,
    )
    await expect(enforceInstitutionDomain(args)).resolves.toEqual(args.data)
  })

  it("rejects a lookalike domain that merely ends with the registered domain", async () => {
    const institution = makeInstitution()
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
    const institution = makeInstitution()
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
    const institution = makeInstitution({
      domains: [{ domain: "Auckland.AC.NZ" }],
    })
    const { args } = makeArgs(
      { email: "Student@AUCKLAND.ac.nz", institution: institution.id },
      institution,
    )
    await expect(enforceInstitutionDomain(args)).resolves.toEqual(args.data)
  })

  it("extracts the id when institution arrives as an already-populated relationship object", async () => {
    const institution = makeInstitution()
    const { args, findByID } = makeArgs(
      { email: "student@auckland.ac.nz", institution },
      institution,
    )
    await enforceInstitutionDomain(args)
    expect(findByID).toHaveBeenCalledWith(expect.objectContaining({ id: institution.id }))
  })
})
