import type { PublicationType } from "@repo/shared/enums/publications"
import type { PublicationSort } from "./publications.search-params"

export type PublicationFilters = {
  search?: string
  sort?: PublicationSort
  /** A publication matches when it has any one of these tags. */
  tags?: string[]
  type?: PublicationType
  year?: number
}

/** A member shown in the author picker, with details that tell same-name members apart. */
export type AuthorCandidate = {
  id: number
  firstName: string
  lastName: string
  position: string
  institution?: string
  avatarUrl?: string
}
