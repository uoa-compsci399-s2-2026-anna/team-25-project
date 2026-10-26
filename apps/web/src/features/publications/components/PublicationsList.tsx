import {
  PaginationNav,
  PublicationCard,
  PublicationCardSkeleton,
} from "@repo/ui/components/composite"
import { BookOpen, SearchX } from "lucide-react"
import type { Route } from "next"
import type { SearchParams } from "nuqs/server"
import { EmptyState } from "@/components/EmptyState"
import { StringHrefLink } from "@/components/StringHrefLink"
import { Routes } from "@/lib/routes"
import { loadPublicationsPage } from "../publications.queries"
import {
  loadPublicationSearchParams,
  serializePublicationSearchParams,
  toPublicationFilters,
} from "../publications.search-params"
import { PublicationCardActionsServer } from "./PublicationCardActionsServer"

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

  // The serializer leaves out defaults, so any query string means a filter is set.
  const hasFilters = getPageHref(1) !== Routes.PUBLICATIONS

  if (publications.length === 0) {
    if (totalDocs > 0) {
      return (
        <EmptyState
          action={{ href: getPageHref(totalPages), label: "Go to the last page" }}
          description="This page is past the end of the results."
          icon={<SearchX />}
          title="No more results"
          variant="list"
        />
      )
    }

    return (
      <EmptyState
        action={hasFilters ? { href: Routes.PUBLICATIONS, label: "Clear filters" } : undefined}
        description="No publications match these filters."
        icon={<BookOpen />}
        title="No publications found"
        variant="list"
      />
    )
  }

  return (
    <div className="flex w-full flex-col gap-8 p-10 md:p-12">
      <div className="flex w-full flex-col gap-8">
        {publications.map((publication) => (
          <PublicationCard
            action={<PublicationCardActionsServer publication={publication} />}
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
