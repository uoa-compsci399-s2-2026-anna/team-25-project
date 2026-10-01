import {
  PaginationNav,
  PublicationCard,
  PublicationCardSkeleton,
} from "@repo/ui/components/composite"
import type { Route } from "next"
import Link from "next/link"
import type { SearchParams } from "nuqs/server"
import { StringHrefLink } from "@/components/StringHrefLink"
import { Routes } from "@/lib/routes"
import { loadPublicationsPage } from "../publications.queries"
import {
  loadPublicationSearchParams,
  serializePublicationSearchParams,
  toPublicationFilters,
} from "../publications.search-params"

const PAGE_SIZE = 10
// Stable keys for the placeholder cards, which have no data of their own.
const skeletonCardIds = Array.from({ length: PAGE_SIZE }, (_, i) => `publication-skeleton-${i}`)

export const PublicationsList = async ({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) => {
  const params = await loadPublicationSearchParams(searchParams)
  const {
    docs: publications,
    totalDocs,
    totalPages,
  } = await loadPublicationsPage(toPublicationFilters(params), {
    limit: PAGE_SIZE,
    page: params.page,
  })

  // Keeps the current filters, so moving between pages only changes the page.
  const getPageHref = (page: number) =>
    serializePublicationSearchParams(Routes.PUBLICATIONS, { ...params, page }) as Route

  // The serializer leaves out defaults, so any query string means a filter is set. The filter
  // bar cannot remove a tag that is not one of its options, such as a renamed tag in an old link.
  const hasFilters = getPageHref(1) !== Routes.PUBLICATIONS

  if (publications.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 p-10 text-center text-muted-foreground md:p-12">
        {totalDocs > 0 ? (
          <>
            <p>This page is past the end of the results.</p>
            <Link className="underline underline-offset-2" href={getPageHref(totalPages)}>
              Go to the last page
            </Link>
          </>
        ) : (
          <>
            <p>No publications match these filters.</p>
            {hasFilters && (
              <Link className="underline underline-offset-2" href={Routes.PUBLICATIONS}>
                Clear filters
              </Link>
            )}
          </>
        )}
      </div>
    )
  }

  return (
    <div className="flex w-full flex-col gap-8 p-10 md:p-12">
      <div className="flex w-full flex-col gap-8">
        {publications.map((publication) => (
          <PublicationCard
            key={publication.id}
            linkComponent={StringHrefLink}
            memberHref={Routes.MEMBERS.MEMBER}
            publication={publication}
          />
        ))}
      </div>
      <PaginationNav
        getHref={getPageHref}
        linkComponent={StringHrefLink}
        page={params.page}
        totalPages={totalPages}
      />
    </div>
  )
}

// A full page of cards, so the footer stays out of view until the real list lands.
export const PublicationsListSkeleton = () => (
  <div className="flex w-full flex-col gap-8 p-10 md:p-12">
    <div className="flex w-full flex-col gap-8">
      {skeletonCardIds.map((id) => (
        <PublicationCardSkeleton key={id} />
      ))}
    </div>
  </div>
)
