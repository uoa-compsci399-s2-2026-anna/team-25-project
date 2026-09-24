import { Heading } from "@repo/ui/components/ui"
import type { SearchParams } from "nuqs/server"
import { getInstitutionOptionsCached } from "@/features/institutions/institutions.queries"
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
    <div className="flex flex-col gap-4 px-10 pt-12 pb-8 md:px-12">
      <Heading level="h1">Members</Heading>
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between md:gap-8">
        <p className="max-w-2xl text-muted-foreground">
          {total} academics who teach or research computing capstones across {institutions.length}{" "}
          universities. Profiles are public; contact details are shown to members.
        </p>
        {/* Past the last page the range would read backwards, and the list says so instead. */}
        {shown > 0 && start <= shown && (
          <p className="shrink-0 text-muted-foreground text-xs">
            Showing {start}-{Math.min(params.page * MEMBERS_PAGE_SIZE, shown)} of {shown}
          </p>
        )}
      </div>
    </div>
  )
}
