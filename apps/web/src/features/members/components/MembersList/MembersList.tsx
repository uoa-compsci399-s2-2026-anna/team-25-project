import { PaginationNav } from "@repo/ui/components/composite"
import { SearchX, Users } from "lucide-react"
import type { Route } from "next"
import type { SearchParams } from "nuqs/server"
import { EmptyState } from "@/components/EmptyState"
import { StringHrefLink } from "@/components/StringHrefLink"
import { Routes } from "@/lib/routes"
import { loadMemberCount, loadMembersPage, MEMBERS_PAGE_SIZE } from "../../members.queries"
import {
  loadMemberSearchParams,
  serializeMemberSearchParams,
  toMemberFilters,
} from "../../members.search-params"
import { MemberCard, MemberCardSkeleton } from "./MemberCard"

// Rows split by dividers on phones.
const gridClassName = "grid w-full gap-6 max-sm:gap-0 max-sm:divide-y sm:grid-cols-2 lg:grid-cols-4"

// Stable keys for the placeholder cards, which have no data of their own.
const skeletonCardIds = Array.from({ length: MEMBERS_PAGE_SIZE }, (_, i) => `member-skeleton-${i}`)

export const MembersList = async ({ searchParams }: { searchParams: Promise<SearchParams> }) => {
  const params = await loadMemberSearchParams(searchParams)
  const filters = toMemberFilters(params)
  const { docs: members, totalPages } = await loadMembersPage(filters, {
    limit: MEMBERS_PAGE_SIZE,
    page: params.page,
  })

  // Keeps the current filters, so moving between pages only changes the page.
  const getPageHref = (page: number) =>
    serializeMemberSearchParams(Routes.MEMBERS.ROOT, { ...params, page }) as Route

  // The serializer leaves out defaults, so any query string means a filter is set.
  const hasFilters = getPageHref(1) !== Routes.MEMBERS.ROOT

  if (members.length === 0) {
    // find() reports no totals past the end of a relationship-filtered query, so both
    // the empty state and the page to recover to come from a count instead.
    const matches = await loadMemberCount(filters)

    if (matches > 0) {
      return (
        <EmptyState
          action={{
            href: getPageHref(Math.ceil(matches / MEMBERS_PAGE_SIZE)),
            label: "Go to the last page",
          }}
          description="This page is past the end of the results."
          icon={<SearchX />}
          title="No more results"
          variant="list"
        />
      )
    }

    return (
      <EmptyState
        action={hasFilters ? { href: Routes.MEMBERS.ROOT, label: "Clear filters" } : undefined}
        description="No members match these filters."
        icon={<Users />}
        title="No members found"
        variant="list"
      />
    )
  }

  return (
    <div className="flex w-full flex-col gap-8 p-10 md:p-12">
      <div className={gridClassName}>
        {members.map((member) => {
          const institution =
            typeof member.institution === "number" ? undefined : member.institution
          const avatar =
            member.avatar && typeof member.avatar !== "number" ? member.avatar : undefined

          return (
            <MemberCard
              avatarSrc={avatar?.url ?? undefined}
              country={institution?.country}
              firstName={member.firstName}
              href={Routes.MEMBERS.MEMBER(member.id)}
              institution={institution?.name}
              key={member.id}
              lastName={member.lastName}
              position={member.position}
              researchInterests={member.researchInterests}
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
export const MembersListSkeleton = () => (
  <div className="flex w-full flex-col gap-8 p-10 md:p-12">
    <div className={gridClassName}>
      {skeletonCardIds.map((id) => (
        <MemberCardSkeleton key={id} />
      ))}
    </div>
  </div>
)
