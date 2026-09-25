import type { SearchParams } from "nuqs/server"
import { Suspense } from "react"
import { PageContainer } from "@/components/PageContainer"
import { MembersFilterServer } from "@/features/members/components/MembersFilterServer"
import { MembersHeader } from "@/features/members/components/MembersHeader"
import { MembersList } from "@/features/members/components/MembersList"

export default function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return (
    <>
      <PageContainer>
        <Suspense fallback={<div>loading..</div>}>
          <MembersHeader searchParams={searchParams} />
        </Suspense>
      </PageContainer>
      <Suspense fallback={<div>loading..</div>}>
        <MembersFilterServer />
      </Suspense>
      <PageContainer>
        <Suspense fallback={<div>loading..</div>}>
          <MembersList searchParams={searchParams} />
        </Suspense>
      </PageContainer>
    </>
  )
}
