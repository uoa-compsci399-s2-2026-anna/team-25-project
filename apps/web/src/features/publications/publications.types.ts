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
