import type { Member } from "@repo/shared/payload-types"
import type { CollectionBeforeValidateHook } from "payload"
import { ValidationError } from "payload"
import { Slugs } from "@/lib/payload/slugs"

const getEmailDomain = (email: string) => email.split("@").at(-1)?.toLowerCase() ?? ""

// auckland.ac.nz allows student@auckland.ac.nz and student@cs.auckland.ac.nz,
// but not student@notauckland.ac.nz - the leading dot on the suffix check matters.
const domainMatches = (emailDomain: string, allowedDomain: string) =>
  emailDomain === allowedDomain || emailDomain.endsWith(`.${allowedDomain}`)

// Proves the submitted email's domain matches the selected institution's
// whitelist - not that the registrant owns that mailbox. That gap is closed
// by email verification, which is out of scope for now.
export const enforceInstitutionDomain: CollectionBeforeValidateHook<Member> = async ({
  data,
  originalDoc,
  req,
}) => {
  const email = data?.email ?? originalDoc?.email
  const institutionValue = data?.institution ?? originalDoc?.institution
  const institutionId =
    typeof institutionValue === "object" ? institutionValue?.id : institutionValue

  // Either field is missing its own required-field validation error already;
  // nothing to cross-check yet.
  if (!email || !institutionId) return data

  const institution = await req.payload.findByID({
    collection: Slugs.Collections.INSTITUTIONS,
    id: institutionId,
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
    domainMatches(emailDomain, domain.toLowerCase()),
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
