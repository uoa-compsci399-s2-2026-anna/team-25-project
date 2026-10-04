import { convertLexicalToPlaintext } from "@payloadcms/richtext-lexical/plaintext"
import { PaginationNav, ResourceCard, ResourceCardSkeleton } from "@repo/ui/components/composite"
import type { Route } from "next"
import Link from "next/link"
import type { SearchParams } from "nuqs/server"
import { StringHrefLink } from "@/components/StringHrefLink"
import { Routes } from "@/lib/routes"
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
            <p>No resources match these filters.</p>
            {hasFilters && (
              <Link className="underline underline-offset-2" href={Routes.RESOURCES.ROOT}>
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
        {resources.map((resource) => {
          const owner = typeof resource.owner === "object" ? resource.owner : undefined
          const avatar =
            owner?.avatar && typeof owner.avatar === "object" ? owner.avatar : undefined
          const course = typeof resource.course === "object" ? resource.course : undefined

          return (
            <ResourceCard
              course={course?.code}
              href={Routes.RESOURCES.RESOURCE(String(resource.id))}
              key={resource.id}
              linkComponent={StringHrefLink}
              owner={{
                avatarSrc: avatar?.url ?? undefined,
                href: owner ? Routes.MEMBERS.MEMBER(owner.id) : undefined,
                name: owner ? `${owner.firstName} ${owner.lastName}` : "Unknown member",
              }}
              sharedAt={resource.createdAt}
              summary={
                convertLexicalToPlaintext({ data: resource.description }).trim() || undefined
              }
              title={resource.title}
            />
          )
        })}
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
