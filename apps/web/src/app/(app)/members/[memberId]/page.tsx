import { Separator } from "@repo/ui/components/ui"
import { Suspense } from "react"
import { PageContainer } from "@/components/PageContainer"
import {
  MemberHeader,
  MemberHeaderSkeleton,
} from "@/features/members/components/MemberDetailHeader"
import { MemberDetailLeftColumn } from "@/features/members/components/MemberDetailLeftColumn"
import { MemberDetailRightColumn } from "@/features/members/components/MemberDetailRightColumn"
import type { MembersRouteParams } from "@/features/members/members.params"

export default function Page({ params }: { params: MembersRouteParams }) {
  return (
    <PageContainer>
      <article className="grid w-full gap-x-10 gap-y-8 p-10 md:p-12 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-x-12">
        <div className="lg:col-span-2">
          <Suspense fallback={<MemberHeaderSkeleton />}>
            <MemberHeader params={params} />
          </Suspense>
        </div>
        <Separator className="lg:col-span-2" />
        <MemberDetailLeftColumn params={params} />
        <MemberDetailRightColumn params={params} />
      </article>
    </PageContainer>
  )
}
