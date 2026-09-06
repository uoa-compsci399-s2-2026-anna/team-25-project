/**
 * Proposal URLs look like /proposals/42-team-assessment-fairness.
 *
 * Only the leading id identifies the proposal; the slug that follows is there
 * for readability and search engines. That split lets the slug track the title
 * on every edit without breaking links people have already shared.
 */
export const proposalPath = (proposal: { id: number | string; proposalSlug?: string | null }) =>
  `/proposals/${proposal.id}${proposal.proposalSlug ? `-${proposal.proposalSlug}` : ""}`

/**
 * Pulls the id back out of a route param. Returns null when the param does not
 * start with digits, so a malformed URL 404s rather than querying with NaN.
 */
export const parseProposalId = (param: string): number | null => {
  const [id] = /^\d+/.exec(param) ?? []
  return id ? Number(id) : null
}
