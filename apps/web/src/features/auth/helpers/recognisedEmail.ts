/**
 * Mirrors `enforceInstitutionDomain` on the server so the form can tell someone
 * their address is recognised before they submit. The server check is still the
 * one that decides - this only ever previews the same answer.
 */
export const emailDomain = (email: string) => email.split("@").at(-1)?.trim().toLowerCase() ?? ""

/** `auckland.ac.nz` accepts `cs.auckland.ac.nz` but not `notauckland.ac.nz`. */
export const isRecognisedEmail = (email: string, domains: readonly string[]) => {
  if (!email.includes("@")) return false

  const candidate = emailDomain(email)
  if (!candidate) return false

  return domains.some((domain) => {
    const allowed = domain.trim().toLowerCase()
    return candidate === allowed || candidate.endsWith(`.${allowed}`)
  })
}
