import { QueryKeys } from "@repo/shared/constants/query-keys"
import type { Member } from "@repo/shared/payload-types"
import { normaliseInterests } from "@repo/shared/utils/interests"
import { revalidateTag } from "next/cache"
import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  CollectionBeforeDeleteHook,
  CollectionBeforeOperationHook,
  CollectionBeforeValidateHook,
  FieldHook,
} from "payload"
import { Forbidden, ValidationError } from "payload"
import { Slugs } from "@/lib/payload/slugs"
import { admin } from "../access/helpers"
import { fail } from "./helpers"

// Cached proposal lists and details show each author's name, avatar and institution, and lists filter
// on the institution. Details depend on the members tag; the member's own profile uses its id tag.
export const revalidateMemberProposals: CollectionAfterChangeHook<Member> = ({ doc, req }) => {
  if (!req.context.disableRevalidate) {
    revalidateTag(QueryKeys.PROPOSALS.ROOT, "max")
    revalidateTag(QueryKeys.MEMBERS.ROOT, "max")
    revalidateTag(QueryKeys.MEMBERS.ID(doc.id), "max")
  }
  return doc
}

export const revalidateDeletedMemberProposals: CollectionAfterDeleteHook<Member> = ({
  doc,
  req,
}) => {
  if (!req.context.disableRevalidate) {
    revalidateTag(QueryKeys.PROPOSALS.ROOT, "max")
    revalidateTag(QueryKeys.MEMBERS.ROOT, "max")
    revalidateTag(QueryKeys.MEMBERS.ID(doc.id), "max")
  }
  return doc
}

// A resource's owner is required, so deleting its owner would fail on the
// database constraint. Refuse up front with something an admin can act on.
export const assertMemberDeletable: CollectionBeforeDeleteHook = async ({ id, req }) => {
  const { totalDocs } = await req.payload.count({
    collection: Slugs.Collections.RESOURCES,
    where: { owner: { equals: id } },
    req,
    overrideAccess: true,
  })

  if (totalDocs)
    fail(
      `This member owns ${totalDocs} ${totalDocs === 1 ? "resource" : "resources"}. Delete or reassign them first.`,
      409,
    )
}

// split() never returns [], so at(-1) is always safe; trim() guards whitespace Payload never strips for us.
// biome-ignore lint/style/noNonNullAssertion: at(-1) is safe, see above
const getEmailDomain = (email: string) => email.split("@").at(-1)!.trim().toLowerCase()

// auckland.ac.nz allows student@auckland.ac.nz and student@cs.auckland.ac.nz,
// but not student@notauckland.ac.nz - the leading dot on the suffix check matters.
const domainMatches = (emailDomain: string, allowedDomain: string) =>
  emailDomain === allowedDomain || emailDomain.endsWith(`.${allowedDomain}`)

// Proves the submitted email's domain matches the selected institution's
// whitelist - not that the registrant owns that mailbox. The sign-up email
// code proves that.
export const enforceInstitutionDomain: CollectionBeforeValidateHook<Member> = async ({
  data,
  req,
}) => {
  if (req.context.skipDomainCheck) return data

  // Payload's own field-level beforeValidate step already backfills any field
  // omitted from a partial update with its value from the existing document,
  // so data.email/data.institution are only genuinely absent here on create,
  // or on update if the client explicitly tried to null one out - which
  // should fail rather than be quietly validated against the old value.
  const email = data?.email
  const institutionValue = data?.institution
  const institutionId =
    typeof institutionValue === "object" ? institutionValue?.id : institutionValue

  // Either field is missing its own required-field validation error already;
  // nothing to cross-check yet.
  if (!email || !institutionId) return data

  const institution = await req.payload.findByID({
    collection: Slugs.Collections.INSTITUTIONS,
    id: institutionId,
    // findByID throws NotFound by default on a miss; we want a 400 scoped to
    // the institution field instead of a bare 404, so disable that and
    // handle the miss ourselves below.
    disableErrors: true,
    req,
  })

  if (!institution) {
    throw new ValidationError({
      errors: [{ path: "institution", message: "Selected institution does not exist." }],
      req,
    })
  }

  const emailDomain = getEmailDomain(email)
  const isAllowed = institution.domains.some(({ domain }) =>
    domainMatches(emailDomain, domain.trim().toLowerCase()),
  )

  if (!isAllowed) {
    throw new ValidationError({
      errors: [
        {
          path: "email",
          message: `Email domain does not match a registered domain for ${institution.name}.`,
        },
      ],
      req,
    })
  }

  return data
}

// Runs before validation so maxRows counts what is kept. The directory filter also matches
// research interests exactly, so a stored " Teamwork" would never match the trimmed value.
export const normaliseStoredInterests: FieldHook<Member, string[] | null | undefined> = ({
  value,
}) => (Array.isArray(value) ? normaliseInterests(value) : value)

/**
 * Members change a password only through the app's reset pages, which limit emails
 * and end other sessions. REST resets are closed to all callers. REST password
 * updates are closed to all except admins, because they need no old password.
 */
export const allowPasswordChangesFromAppOnly: CollectionBeforeOperationHook = ({
  args,
  operation,
  req,
}) => {
  if (req.payloadAPI === "local") return args
  const isReset = operation === "forgotPassword" || operation === "resetPassword"
  const data: object | undefined = "data" in args ? args.data : undefined
  const isPasswordUpdate =
    operation === "update" && !admin(req) && Boolean(data && "password" in data && data.password)
  if (isReset || isPasswordUpdate) throw new Forbidden(req.t)
  return args
}

/**
 * Only admins can change a member's verified email or its institution. The field
 * access rules drop the change and still report success, so refuse it with an error here.
 */
export const refuseIdentityChangesFromMembers: CollectionBeforeOperationHook = ({
  args,
  operation,
  req,
}) => {
  if (operation !== "update" || req.payloadAPI === "local" || admin(req)) return args
  const data: object | undefined = "data" in args ? args.data : undefined
  if (data && ("email" in data || "institution" in data)) throw new Forbidden(req.t)
  return args
}
