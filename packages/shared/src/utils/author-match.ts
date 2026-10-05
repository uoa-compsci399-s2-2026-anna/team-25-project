import type { Creator } from "@retorquere/bibtex-parser"

/** A name split into given names and family name, e.g. from BibTeX or a typed name. */
export type PrintedName = { given: string[]; family: string }

type MemberName = { firstName: string; lastName: string }

/** Lowercase, without accents. Hyphens and dots become spaces. */
export const normaliseName = (value: string) =>
  value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[.\-‐–]/g, " ")
    .replace(/\s+/g, " ")
    .trim()

const splitGiven = (given: string) =>
  given
    .split(/[\s.]+/)
    .map(normaliseName)
    .filter(Boolean)

const fromString = (name: string): PrintedName => {
  const [before, after] = name.split(",", 2)
  if (after !== undefined) return { given: splitGiven(after), family: normaliseName(before ?? "") }

  const tokens = name.trim().split(/\s+/)
  return {
    given: splitGiven(tokens.slice(0, -1).join(" ")),
    family: normaliseName(tokens.at(-1) ?? ""),
  }
}

/** Reads "First Last", "Last, First" or a parsed BibTeX creator. */
export const parsePrintedName = (input: string | Creator): PrintedName => {
  if (typeof input === "string") return fromString(input)
  // An organisation ("{World Health Organization}") has only `name`.
  if (input.name) return { given: [], family: normaliseName(input.name) }
  return {
    given: splitGiven(input.firstName ?? ""),
    family: normaliseName([input.prefix, input.lastName].filter(Boolean).join(" ")),
  }
}

/**
 * Compares a printed author name with a member's name. The family name must match.
 * Each given name must equal the member's, or be its initial ("J." ~ "Jane").
 * Members often leave out middle names, so extra printed given names are allowed.
 */
export const matchMember = (
  printed: PrintedName,
  member: MemberName,
): "exact" | "initials" | null => {
  // A family name alone fits too many people. A braced BibTeX name ("{Jane Smith}")
  // arrives as one family string, so compare it with the full name.
  if (printed.given.length === 0) {
    return printed.family === normaliseName(`${member.firstName} ${member.lastName}`)
      ? "exact"
      : null
  }

  if (printed.family !== normaliseName(member.lastName)) return null

  const memberGiven = splitGiven(member.firstName)
  let exact = true
  for (const [index, token] of printed.given.entries()) {
    const expected = memberGiven[index]
    if (expected === undefined) {
      // The first given name is required. Later ones are middle names the member left out.
      if (index === 0) return null
      exact = false
      continue
    }
    if (token === expected) continue
    if (token.length === 1 && expected.startsWith(token)) {
      exact = false
      continue
    }
    return null
  }
  return exact ? "exact" : "initials"
}

/** The members whose name can be the printed name, exact matches first. */
export const suggestMembers = <T extends MemberName>(printed: PrintedName, members: readonly T[]) =>
  members
    .map((member) => ({ member, quality: matchMember(printed, member) }))
    .filter(({ quality }) => quality !== null)
    .sort((a, b) => Number(b.quality === "exact") - Number(a.quality === "exact"))
    .map(({ member }) => member)
