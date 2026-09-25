import type { SearchParams } from "nuqs/server"
import { getInstitutionOptionsCached } from "@/features/institutions/institutions.queries"
import { PageHeader } from "@/features/layout/components"
import { getMemberCounts, MEMBERS_PAGE_SIZE } from "../members.queries"
import { loadMemberSearchParams, toMemberFilters } from "../members.search-params"

export const MembersHeader = async ({ searchParams }: { searchParams: Promise<SearchParams> }) => {
  const params = await loadMemberSearchParams(searchParams)
  const [{ shown, total }, institutions] = await Promise.all([
    getMemberCounts(toMemberFilters(params)),
    getInstitutionOptionsCached(),
  ])

  const start = (params.page - 1) * MEMBERS_PAGE_SIZE + 1

  return (
    <PageHeader
      actions={
        // Past the last page the range would read backwards, and the list says so instead.
        shown > 0 &&
        start <= shown && (
          <p className="shrink-0 text-muted-foreground text-xs">
            Showing {start}-{Math.min(params.page * MEMBERS_PAGE_SIZE, shown)} of {shown}
          </p>
        )
      }
      align="end"
      description={
        <>
          {total} academics who teach or research computing capstones across {institutions.length}{" "}
          universities. Profiles are public; contact details are shown to members.
        </>
      }
      title="Members"
    />
  )
}
