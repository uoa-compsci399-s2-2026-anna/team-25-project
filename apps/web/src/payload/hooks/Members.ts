import { QueryKeys } from "@repo/shared/constants/query-keys"
import type { Member } from "@repo/shared/payload-types"
import { revalidateTag } from "next/cache"
import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  CollectionBeforeValidateHook,
} from "payload"
import { ValidationError } from "payload"
import { Slugs } from "@/lib/payload/slugs"

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

// split() never returns [], so at(-1) is always safe; trim() guards whitespace Payload never strips for us.
// biome-ignore lint/style/noNonNullAssertion: at(-1) is safe, see above
const getEmailDomain = (email: string) => email.split("@").at(-1)!.trim().toLowerCase()

// auckland.ac.nz allows student@auckland.ac.nz and student@cs.auckland.ac.nz,
// but not student@notauckland.ac.nz - the leading dot on the suffix check matters.
const domainMatches = (emailDomain: string, allowedDomain: string) =>
  emailDomain === allowedDomain || emailDomain.endsWith(`.${allowedDomain}`)

// Proves the submitted email's domain matches the selected institution's
// whitelist - not that the registrant owns that mailbox. That gap is closed
// by email verification, which is out of scope for now.
export const enforceInstitutionDomain: CollectionBeforeValidateHook<Member> = async ({
  data,
  req,
}) => {
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
