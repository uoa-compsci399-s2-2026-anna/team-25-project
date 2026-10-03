import type { Course, Institution } from "@repo/shared/payload-types"
import type { ResourceSort } from "./resources.search-params"

export type ResourceFilters = {
  courseId?: Course["id"]
  /** Matches on the owner's institution, as the proposals list does on its authors'. */
  institutionId?: Institution["id"]
  search?: string
  sort?: ResourceSort
}
