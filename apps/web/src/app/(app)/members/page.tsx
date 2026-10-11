import { AnimatedSuspense, Skeleton } from "@repo/ui/components/ui"
import type { SearchParams } from "nuqs/server"
import { PageContainer, PageHeaderSkeleton } from "@/features/layout/components"
import {
  MembersFilterServer,
  MembersFilterServerSkeleton,
} from "@/features/members/components/MembersList/MembersFilterServer"
import { MembersHeader } from "@/features/members/components/MembersList/MembersHeader"
import {
  MembersList,
  MembersListSkeleton,
} from "@/features/members/components/MembersList/MembersList"

export default function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return (
    <>
      <PageContainer>
        <AnimatedSuspense
          fallback={
            <PageHeaderSkeleton
              actions={<Skeleton className="h-3 w-32 shrink-0" />}
              align="end"
              title="Members"
            />
          }
        >
          <MembersHeader searchParams={searchParams} />
        </AnimatedSuspense>
      </PageContainer>
      <AnimatedSuspense fallback={<MembersFilterServerSkeleton />}>
        <MembersFilterServer />
      </AnimatedSuspense>
      <PageContainer>
        <AnimatedSuspense fallback={<MembersListSkeleton />}>
          <MembersList searchParams={searchParams} />
        </AnimatedSuspense>
      </PageContainer>
    </>
  )
}
