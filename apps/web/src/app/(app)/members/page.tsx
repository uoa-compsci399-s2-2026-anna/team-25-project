import type { SearchParams } from "nuqs/server"
import { Suspense } from "react"
import {
  MembersFilterServer,
  MembersFilterServerSkeleton,
} from "@/features/members/components/MembersFilterServer"
import { MembersHeader, MembersHeaderSkeleton } from "@/features/members/components/MembersHeader"
import { MembersList, MembersListSkeleton } from "@/features/members/components/MembersList"

export default function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return (
    <>
      <Suspense fallback={<MembersHeaderSkeleton />}>
        <MembersHeader searchParams={searchParams} />
      </Suspense>
      <Suspense fallback={<MembersFilterServerSkeleton />}>
        <MembersFilterServer />
      </Suspense>
      <Suspense fallback={<MembersListSkeleton />}>
        <MembersList searchParams={searchParams} />
      </Suspense>
    </>
  )
}
