import { PaginationNav, ResourceCard, ResourceCardSkeleton } from "@repo/ui/components/composite"
import { FolderOpen, SearchX } from "lucide-react"
import type { Route } from "next"
import type { SearchParams } from "nuqs/server"
import { EmptyState } from "@/components/EmptyState"
import { StringHrefLink } from "@/components/StringHrefLink"
import { Routes } from "@/lib/routes"
import { toResourceCardProps } from "../resource-card-props"
import { loadResourcesPage } from "../resources.queries"
import {
  loadResourceSearchParams,
  serializeResourceSearchParams,
  toResourceFilters,
} from "../resources.search-params"

const PAGE_SIZE = 10
// Stable keys for the placeholder cards, which have no data of their own.
const skeletonCardIds = Array.from({ length: PAGE_SIZE }, (_, i) => `resource-skeleton-${i}`)

export const ResourcesList = async ({ searchParams }: { searchParams: Promise<SearchParams> }) => {
  const params = await loadResourceSearchParams(searchParams)
  const {
    docs: resources,
    totalDocs,
    totalPages,
  } = await loadResourcesPage(toResourceFilters(params), {
    limit: PAGE_SIZE,
    page: params.page,
  })

  // Keeps the current filters, so moving between pages only changes the page.
  const getPageHref = (page: number) =>
    serializeResourceSearchParams(Routes.RESOURCES.ROOT, { ...params, page }) as Route

  // The serializer leaves out defaults, so any query string means a filter is set.
  const hasFilters = getPageHref(1) !== Routes.RESOURCES.ROOT

  if (resources.length === 0) {
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
        action={hasFilters ? { href: Routes.RESOURCES.ROOT, label: "Clear filters" } : undefined}
        description="No resources match these filters."
        icon={<FolderOpen />}
        title="No resources found"
        variant="list"
      />
    )
  }

  return (
    <div className="flex w-full flex-col gap-8 p-10 md:p-12">
      <div className="flex w-full flex-col gap-8">
        {resources.map((resource) => (
          <ResourceCard
            key={resource.id}
            linkComponent={StringHrefLink}
            {...toResourceCardProps(resource)}
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
export const ResourcesListSkeleton = () => (
  <div className="flex w-full flex-col gap-8 p-10 md:p-12">
    <div className="flex w-full flex-col gap-8">
      {skeletonCardIds.map((id) => (
        <ResourceCardSkeleton key={id} />
      ))}
    </div>
  </div>
)
