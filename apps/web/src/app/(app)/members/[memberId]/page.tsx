import { AnimatedSuspense, Separator } from "@repo/ui/components/ui"
import { cn } from "@repo/ui/lib/utils"
import { BackLink, PageContainer } from "@/features/layout/components"
import {
  MemberHeader,
  MemberHeaderSkeleton,
} from "@/features/members/components/MemberDetail/MemberDetailHeader"
import { MemberDetailLeftColumn } from "@/features/members/components/MemberDetail/MemberDetailLeftColumn"
import { MemberDetailRightColumn } from "@/features/members/components/MemberDetail/MemberDetailRightColumn"
import { mobileSection } from "@/features/members/components/MemberDetail/mobileSection"
import { EditProvider } from "@/features/members/components/MemberEditor/EditContext"
import type { MembersRouteParams } from "@/features/members/members.params"
import { Routes } from "@/lib/routes"

export default function Page({ params }: { params: MembersRouteParams }) {
  return (
    <PageContainer>
      <BackLink href={Routes.MEMBERS.ROOT}>Members</BackLink>
      {/* On phones the sections run edge to edge in one column, each owning its padding. */}
      <article className="grid w-full gap-x-10 gap-y-8 p-10 max-md:flex max-md:flex-col max-md:gap-0 max-md:p-0 md:p-12 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-x-12">
        <EditProvider>
          <div className={cn("max-md:order-1 lg:col-span-2", mobileSection)}>
            <AnimatedSuspense fallback={<MemberHeaderSkeleton />}>
              <MemberHeader params={params} />
            </AnimatedSuspense>
          </div>
          <Separator className="max-md:hidden lg:col-span-2" />
          <MemberDetailLeftColumn params={params} />
          <MemberDetailRightColumn params={params} />
        </EditProvider>
      </article>
    </PageContainer>
  )
}
