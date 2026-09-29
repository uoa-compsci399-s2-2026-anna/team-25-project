import { AnimatedSuspense } from "@repo/ui/components/ui"
import type { SearchParams } from "nuqs/server"
import {
  MembersFilterServer,
  MembersFilterServerSkeleton,
} from "@/features/members/components/MembersFilterServer"
import { MembersHeader, MembersHeaderSkeleton } from "@/features/members/components/MembersHeader"
import { MembersList, MembersListSkeleton } from "@/features/members/components/MembersList"

export default function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return (
    <>
      <AnimatedSuspense fallback={<MembersHeaderSkeleton />}>
        <MembersHeader searchParams={searchParams} />
      </AnimatedSuspense>
      <AnimatedSuspense fallback={<MembersFilterServerSkeleton />}>
        <MembersFilterServer />
      </AnimatedSuspense>
      <AnimatedSuspense fallback={<MembersListSkeleton />}>
        <MembersList searchParams={searchParams} />
      </AnimatedSuspense>
    </>
  )
}
