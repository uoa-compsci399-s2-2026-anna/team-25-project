import { PaginationNav } from "@repo/ui/components/composite"
import type { Route } from "next"
import Link from "next/link"
import type { SearchParams } from "nuqs/server"
import { StringHrefLink } from "@/components/StringHrefLink"
import { Routes } from "@/lib/routes"
import { countMembers, getMembers, MEMBERS_PAGE_SIZE } from "../members.queries"
import {
  loadMemberSearchParams,
  serializeMemberSearchParams,
  toMemberFilters,
} from "../members.search-params"
import { MemberCard } from "./MemberCard"

export const MembersList = async ({ searchParams }: { searchParams: Promise<SearchParams> }) => {
  const params = await loadMemberSearchParams(searchParams)
  const filters = toMemberFilters(params)
  const { docs: members, totalPages } = await getMembers(filters, {
    limit: MEMBERS_PAGE_SIZE,
    page: params.page,
  })

  // Keeps the current filters, so moving between pages only changes the page.
  const getPageHref = (page: number) =>
    serializeMemberSearchParams(Routes.MEMBERS.ROOT, { ...params, page }) as Route

  if (members.length === 0) {
    // find() reports no totals past the end of a relationship-filtered query, so both
    // the empty state and the page to recover to come from a count instead.
    const matches = await countMembers(filters)

    return (
      <div className="flex flex-col items-center gap-2 p-10 text-center text-muted-foreground md:p-12">
        {matches > 0 ? (
          <>
            <p>This page is past the end of the results.</p>
            <Link
              className="underline underline-offset-2"
              href={getPageHref(Math.ceil(matches / MEMBERS_PAGE_SIZE))}
            >
              Go to the last page
            </Link>
          </>
        ) : (
          <p>No members match these filters.</p>
        )}
      </div>
    )
  }

  return (
    <div className="flex w-full flex-col gap-8 p-10 md:p-12">
      <div className="grid w-full gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
