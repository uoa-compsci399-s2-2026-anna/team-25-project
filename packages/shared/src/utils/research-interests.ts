/** Trimmed, blanks dropped and deduplicated - the one shape interests are stored, filtered and shown in. */
export const normaliseResearchInterests = (interests: readonly string[]) => [
  ...new Set(interests.map((interest) => interest.trim()).filter(Boolean)),
]
