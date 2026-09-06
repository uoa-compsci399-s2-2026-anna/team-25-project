import { ProposalStatus } from "@repo/shared/enums/proposals"
import type { FieldHook } from "payload"
import { Slugs } from "@/lib/payload/slugs"

const MAX_SLUG_LENGTH = 80

/**
 * NFKD splits accented characters into a base letter plus a combining mark, so
 * stripping the marks turns "Māori" into "maori" rather than "m-ori".
 */
const slugify = (title: string): string =>
  title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, MAX_SLUG_LENGTH)
    .replace(/^-|-$/g, "")

/**
 * Rebuilds the slug from the title on every save.
 *
 * Safe to regenerate because the slug is decorative: proposal URLs resolve on
 * the leading id (see proposalPath), so a stale slug in an old link still
 * reaches the right proposal.
 *
 * `data` only carries the fields the request sent, so a partial update that
 * omits the title falls back to the saved one rather than resetting the slug.
 */
export const generateProposalSlug: FieldHook = ({ data, originalDoc, value }) => {
  const title = data?.title ?? originalDoc?.title
  return (title && slugify(title)) || value || "proposal"
}

/**
 * Stamps the close date when a proposal is closed, and clears it when it reopens.
 *
 * Reads the status from the saved document when the request does not send one,
 * so a partial update to any other field leaves an existing close date alone.
 */
export const setProposalClosedAt: FieldHook = ({ value, siblingData, originalDoc }) => {
  const status = siblingData?.status ?? originalDoc?.status
  if (status !== ProposalStatus.CLOSED) return null
  return value || new Date().toISOString()
}

/**
 * Adds the member creating a proposal to its authors, keeping any collaborators
 * they named alongside themselves. Admins keep the ability to set authors
 * directly, since they are not members and cannot author anything.
 */
export const defaultProposalAuthor: FieldHook = ({ value, req, operation }) => {
  if (operation !== "create") return value
  if (req.user?.collection !== Slugs.Collections.MEMBERS) return value
  const collaborators = Array.isArray(value) ? value : []
  return [...new Set([req.user.id, ...collaborators])]
}
