// BibTeX entry types. Values match the BibTeX keyword so import/export is a
// direct mapping.
export const PublicationType = {
  ARTICLE: "article",
  BOOK: "book",
  BOOKLET: "booklet",
  IN_BOOK: "inbook",
  IN_COLLECTION: "incollection",
  IN_PROCEEDINGS: "inproceedings",
  MANUAL: "manual",
  MASTERS_THESIS: "mastersthesis",
  PHD_THESIS: "phdthesis",
  PROCEEDINGS: "proceedings",
  TECH_REPORT: "techreport",
  UNPUBLISHED: "unpublished",
  MISC: "misc",
} as const

export type PublicationType = (typeof PublicationType)[keyof typeof PublicationType]

export const PublicationTypeLabels: Record<PublicationType, string> = {
  [PublicationType.ARTICLE]: "Journal article",
  [PublicationType.BOOK]: "Book",
  [PublicationType.BOOKLET]: "Booklet",
  [PublicationType.IN_BOOK]: "Book chapter",
  [PublicationType.IN_COLLECTION]: "Part of a collection",
  [PublicationType.IN_PROCEEDINGS]: "Conference paper",
  [PublicationType.MANUAL]: "Manual",
  [PublicationType.MASTERS_THESIS]: "Master's thesis",
  [PublicationType.PHD_THESIS]: "PhD thesis",
  [PublicationType.PROCEEDINGS]: "Conference proceedings",
  [PublicationType.TECH_REPORT]: "Technical report",
  [PublicationType.UNPUBLISHED]: "Unpublished",
  [PublicationType.MISC]: "Other",
} as const
