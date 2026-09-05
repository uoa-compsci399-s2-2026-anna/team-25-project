import type { Member } from "@repo/shared/payload-types"
import type { CollectionBeforeValidateHook } from "payload"
import { ValidationError } from "payload"
import { Slugs } from "@/lib/payload/slugs"

// split() on any string, including "", always returns a non-empty array, so
// at(-1) can never actually be undefined here - the ?? fallback TS would
// otherwise want is dead code for an unreachable case.
// Payload doesn't trim/normalise text input for us at any point in the
// pipeline, so a stray space (copy-paste, sloppy form input) would otherwise
// break both the exact-match and subdomain checks below.
// biome-ignore lint/style/noNonNullAssertion: split() is never empty, see above - ?. would reintroduce a string | undefined that fails to typecheck at the domainMatches call site
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
