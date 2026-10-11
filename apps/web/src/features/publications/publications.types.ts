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
  readonly id: number
  readonly firstName: string
  readonly lastName: string
  readonly position: string
  readonly institution?: string
  readonly avatarUrl?: string
}

/** Not ok when the user is not a member, for example after the session ends. */
export type AuthorSearchResult = { ok: true; members: AuthorCandidate[] } | { ok: false }

/** One entry for each name, in order: the member, or null when no single member fits. */
export type AuthorMatchResult = { ok: true; matches: (AuthorCandidate | null)[] } | { ok: false }
