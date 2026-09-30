import { AnimatedSuspense, Separator } from "@repo/ui/components/ui"
import { BackLink, PageContainer } from "@/features/layout/components"
import {
  MemberHeader,
  MemberHeaderSkeleton,
} from "@/features/members/components/MemberDetailHeader"
import { MemberDetailLeftColumn } from "@/features/members/components/MemberDetailLeftColumn"
import { MemberDetailRightColumn } from "@/features/members/components/MemberDetailRightColumn"
import type { MembersRouteParams } from "@/features/members/members.params"
import { Routes } from "@/lib/routes"

export default function Page({ params }: { params: MembersRouteParams }) {
  return (
    <PageContainer>
      <BackLink href={Routes.MEMBERS.ROOT}>Members</BackLink>
      <article className="grid w-full gap-x-10 gap-y-8 p-10 md:p-12 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-x-12">
        <div className="lg:col-span-2">
          <AnimatedSuspense fallback={<MemberHeaderSkeleton />}>
            <MemberHeader params={params} />
          </AnimatedSuspense>
        </div>
        <Separator className="lg:col-span-2" />
        <MemberDetailLeftColumn params={params} />
        <MemberDetailRightColumn params={params} />
      </article>
    </PageContainer>
  )
}
