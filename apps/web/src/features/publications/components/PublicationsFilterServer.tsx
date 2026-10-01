import { FilterBarSkeleton } from "@repo/ui/components/composite"
import { getPublicationTagsCached, getPublicationYearsCached } from "../publications.queries"
import { PublicationsFilterBar } from "./PublicationsFilterBar"

export const PublicationsFilterServer = async () => {
  const [tags, years] = await Promise.all([getPublicationTagsCached(), getPublicationYearsCached()])

  return <PublicationsFilterBar tags={tags} years={years} />
}

export const PublicationsFilterBarSkeleton = () => <FilterBarSkeleton filterCount={3} />
