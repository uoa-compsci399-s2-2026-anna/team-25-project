import { type Creator, type Entry, parse } from "@retorquere/bibtex-parser"
import { PublicationType } from "../enums/publications"
import { type AddPublicationFormInput, DOI_PATTERN, webUrlSchema } from "../schemas/publications"
import { matchMember, type PrintedName, parsePrintedName } from "./author-match"

export type BibtexImportMessage = { level: "error" | "warning" | "info"; text: string }

export type BibtexImportValues = Partial<Omit<AddPublicationFormInput, "authors">>

export type BibtexImportResult = {
  values: BibtexImportValues
  /** Only set when the entry has authors (or editors). Always includes the signed-in member. */
  authors?: AddPublicationFormInput["authors"]
  /** The parsed name of each external author row, by row id, for matching to members. */
  coAuthorNames: { rowId: string; name: PrintedName }[]
  messages: BibtexImportMessage[]
  /** Number of form fields filled. The author list counts as one field. */
  filledCount: number
}

export type PersonName = { firstName: string; lastName: string }

export const SELF_NOT_FOUND_WARNING =
  "We could not find you in the author list, so we added you as the first author. You must be an author of the publication. Move yourself to the correct position."

// A new object each time, so a caller that changes one result cannot change the next.
const parseError = (): BibtexImportResult => ({
  values: {},
  messages: [
    { level: "error", text: "Could not read this BibTeX. Check that it starts with @type{key, …" },
  ],
  coAuthorNames: [],
  filledCount: 0,
})

const PARSE_OPTIONS = {
  // Keep titles as written. Sentence-casing is a guess and would change the user's data.
  sentenceCase: false,
  english: false,
  caseProtection: false,
} as const

const TYPE_ALIASES: Record<string, PublicationType> = {
  conference: PublicationType.IN_PROCEEDINGS,
  thesis: PublicationType.PHD_THESIS,
  report: PublicationType.TECH_REPORT,
  online: PublicationType.MISC,
  electronic: PublicationType.MISC,
  www: PublicationType.MISC,
}

const PUBLICATION_TYPES = new Set<string>(Object.values(PublicationType))

// In order of preference when an entry has more than one.
const VENUE_FIELDS = [
  "journal",
  "journaltitle",
  "booktitle",
  "school",
  "institution",
  "organization",
  "howpublished",
] as const

const MONTH_NAMES = "jan feb mar apr may jun jul aug sep oct nov dec".split(" ")

const DOI_PREFIX = /^(?:https?:\/\/(?:dx\.)?doi\.org\/|doi:\s*)/i

// The parser renders rich text (\textit, \emph, ...) as HTML tags.
const stripMarkup = (value: string) => value.replace(/<\/?[a-z][^>]*>/gi, "").trim()

const asText = (value: string | string[] | undefined): string | undefined => {
  const text = Array.isArray(value) ? value.join(", ") : value
  // The parser decodes LaTeX accents to decomposed characters ("u" + combining mark).
  return text?.normalize("NFC").trim() || undefined
}

const formatCreator = (creator: Creator) =>
  (
    creator.name ??
    [creator.firstName, creator.prefix, creator.lastName, creator.suffix].filter(Boolean).join(" ")
  ).normalize("NFC")

const isSelf = (creator: Creator, self: PersonName) =>
  matchMember(parsePrintedName(creator), self) !== null

const parseMonth = (value: string): string | undefined => {
  const trimmed = value.trim().toLowerCase()
  const number = Number(trimmed)
  if (Number.isInteger(number) && number >= 1 && number <= 12) return String(number)
  const index = MONTH_NAMES.indexOf(trimmed.slice(0, 3))
  return index === -1 ? undefined : String(index + 1)
}

const mapType = (entryType: string, messages: BibtexImportMessage[]): PublicationType => {
  const type = entryType.toLowerCase()
  if (PUBLICATION_TYPES.has(type)) return type as PublicationType
  const alias = TYPE_ALIASES[type]
  if (alias) return alias
  messages.push({
    level: "info",
    text: `The type @${entryType} is not supported, so we set the type to Other.`,
  })
  return PublicationType.MISC
}

const mapAuthors = (
  fields: Entry["fields"],
  self: PersonName,
  used: Set<string>,
  messages: BibtexImportMessage[],
):
  | (Pick<BibtexImportResult, "coAuthorNames"> & { authors: AddPublicationFormInput["authors"] })
  | undefined => {
  let creators = fields.author
  if (creators?.length) {
    used.add("author")
  } else if (fields.editor?.length) {
    creators = fields.editor
    used.add("editor")
    messages.push({ level: "info", text: "The entry has no authors, so we used the editors." })
  } else {
    return undefined
  }

  const named = creators.filter((creator) => creator.lastName !== "others")
  if (named.length < creators.length) {
    messages.push({
      level: "info",
      text: 'The author list ends with "and others". Add the missing authors.',
    })
  }

  const selfIndex = named.findIndex((creator) => isSelf(creator, self))
  const coAuthorNames: BibtexImportResult["coAuthorNames"] = []
  const authors: AddPublicationFormInput["authors"] = named.map((creator, index) => {
    const id = crypto.randomUUID()
    const name = formatCreator(creator)
    if (index === selfIndex) return { id, kind: "self", name }
    coAuthorNames.push({ rowId: id, name: parsePrintedName(creator) })
    return { id, kind: "external", name }
  })
  if (selfIndex === -1) {
    authors.unshift({ id: crypto.randomUUID(), kind: "self", name: "" })
    messages.push({ level: "warning", text: SELF_NOT_FOUND_WARNING })
  }
  return { authors, coAuthorNames }
}

const mapEntry = (entry: Entry, self: PersonName, messages: BibtexImportMessage[]) => {
  const { fields } = entry
  const values: BibtexImportValues = {}
  const used = new Set<string>()
  const take = (name: string) => {
    const value = asText(fields[name as keyof Entry["fields"]] as string | string[] | undefined)
    if (value !== undefined) used.add(name)
    return value
  }

  values.type = mapType(entry.type, messages)
  if (entry.key) values.citationKey = entry.key

  const title = take("title")
  if (title) values.title = stripMarkup(title)
  else messages.push({ level: "warning", text: "The entry has no title. Add one." })

  const mapped = mapAuthors(fields, self, used, messages)

  // biblatex uses `date` (YYYY, YYYY-MM or YYYY-MM-DD) in place of `year` and `month`.
  const date = take("date")?.match(/^(\d{4})(?:-(\d{1,2}))?/)
  const year = take("year") ?? date?.[1]
  // The form already holds a year (the current one), so say when the import keeps it.
  if (!year) messages.push({ level: "warning", text: "The entry has no year. Check the year." })
  else if (/^\d{4}$/.test(year)) values.year = Number(year)
  else
    messages.push({ level: "warning", text: `Could not read the year "${year}". Check the year.` })

  const month = take("month") ?? date?.[2]
  if (month) {
    const parsed = parseMonth(month)
    if (parsed) values.month = parsed
    else messages.push({ level: "info", text: `Could not read the month "${month}".` })
  }

  const venueField = VENUE_FIELDS.find((name) => asText(fields[name]))
  if (venueField) values.venue = stripMarkup(take(venueField) ?? "")

  const volume = take("volume")
  if (volume) values.volume = volume
  const issue = take("number") ?? take("issue")
  if (issue) values.issue = issue
  const pages = take("pages")
  if (pages) values.pages = pages.replace(/\s*(?:--|–|—)\s*/g, "-")
  const publisher = take("publisher")
  if (publisher) values.publisher = publisher
  const url = take("url")
  if (url) {
    values.url = url
    if (!webUrlSchema.safeParse(url).success) {
      messages.push({ level: "warning", text: `The URL "${url}" does not look correct. Check it.` })
    }
  }
  const abstract = take("abstract")
  if (abstract) values.abstract = stripMarkup(abstract)

  const doi = take("doi")?.replace(DOI_PREFIX, "")
  if (doi) {
    values.doi = doi
    if (!DOI_PATTERN.test(doi)) {
      messages.push({ level: "warning", text: `The DOI "${doi}" does not look correct. Check it.` })
    }
  }

  if (fields.keywords?.length) {
    used.add("keywords")
    values.tags = fields.keywords
      .flatMap((keyword) => keyword.split(/[;,]/))
      .map((keyword) => keyword.normalize("NFC").trim())
      .filter(Boolean)
      .join(", ")
  }

  const ignored = Object.keys(fields).filter((name) => !used.has(name))
  if (ignored.length) {
    messages.push({ level: "info", text: `Not imported: ${ignored.join(", ")}.` })
  }

  return { values, authors: mapped?.authors, coAuthorNames: mapped?.coAuthorNames ?? [] }
}

/**
 * Reads the first entry of a BibTeX string and maps it to the add publication
 * form. When the entry has authors (or editors), the signed-in member is always
 * in the returned list: matched by name where possible, otherwise added first
 * with a warning.
 */
export const parseBibtexImport = (text: string, self: PersonName): BibtexImportResult => {
  // Commands the parser cannot convert, such as \foo{bar}, are dropped and only
  // their argument is kept. Record them, so the user can check those fields.
  const unsupported = new Set<string>()
  let library: ReturnType<typeof parse>
  try {
    library = parse(text, {
      ...PARSE_OPTIONS,
      unsupported: (_node, tex) => {
        unsupported.add(tex)
        return ""
      },
    })
  } catch {
    return parseError()
  }

  const [entry, ...rest] = library.entries
  if (!entry) return parseError()

  const messages: BibtexImportMessage[] = []
  if (unsupported.size) {
    messages.push({
      level: "warning",
      text: `Some LaTeX commands could not be read and were removed: ${[...unsupported].join(", ")}. Check the fields.`,
    })
  }
  if (library.errors.length) {
    messages.push({
      level: "warning",
      text: "Part of the BibTeX could not be read. Check the fields below.",
    })
  }
  if (rest.length) {
    messages.push({ level: "info", text: "Only the first entry was imported." })
  }

  const { values, authors, coAuthorNames } = mapEntry(entry, self, messages)
  const filledCount = Object.keys(values).length + (authors ? 1 : 0)
  // Show the most important messages first.
  const order = { error: 0, warning: 1, info: 2 }
  messages.sort((a, b) => order[a.level] - order[b.level])

  return { values, authors, coAuthorNames, messages, filledCount }
}
