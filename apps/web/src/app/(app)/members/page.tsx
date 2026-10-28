import { AnimatedSuspense, Skeleton } from "@repo/ui/components/ui"
import type { Metadata } from "next"
import type { SearchParams } from "nuqs/server"
import { FallbackOnError } from "@/components/FallbackOnError"
import { FiltersUnavailable } from "@/components/FiltersUnavailable"
import { SuspenseSection } from "@/components/SuspenseSection"
import { PageContainer, PageHeaderSkeleton } from "@/features/layout/components"
import {
  MembersFilterServer,
  MembersFilterServerSkeleton,
} from "@/features/members/components/MembersList/MembersFilterServer"
import {
  MembersHeader,
  MembersHeaderWithoutCounts,
} from "@/features/members/components/MembersList/MembersHeader"
import {
  MembersList,
  MembersListSkeleton,
} from "@/features/members/components/MembersList/MembersList"
import { Routes } from "@/lib/routes"

export const metadata: Metadata = {
  title: "Members",
  description: "Academics who teach or research computing capstones in Australia and New Zealand.",
}

export default function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return (
    <>
      <PageContainer>
        <FallbackOnError fallback={<MembersHeaderWithoutCounts />}>
          <AnimatedSuspense
            fallback={
              <PageHeaderSkeleton
                actions={<Skeleton className="h-3 w-32 shrink-0" />}
                align="end"
                centerOnMobile
                title="Members"
              />
            }
          >
            <MembersHeader searchParams={searchParams} />
          </AnimatedSuspense>
        </FallbackOnError>
      </PageContainer>
      <FallbackOnError fallback={<FiltersUnavailable clearHref={Routes.MEMBERS.ROOT} />}>
        <AnimatedSuspense fallback={<MembersFilterServerSkeleton />}>
          <MembersFilterServer />
        </AnimatedSuspense>
      </FallbackOnError>
      <PageContainer>
        <SuspenseSection
          errorTitle="Could not load members"
          errorVariant="list"
          fallback={<MembersListSkeleton />}
        >
          <MembersList searchParams={searchParams} />
        </SuspenseSection>
      </PageContainer>
    </>
  )
}
