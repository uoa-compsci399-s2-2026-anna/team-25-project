import type { SearchParams } from "nuqs/server"
import { Suspense } from "react"
import { MembersFilterServer } from "@/features/members/components/MembersFilterServer"
import { MembersHeader } from "@/features/members/components/MembersHeader"
import { MembersList } from "@/features/members/components/MembersList"

export default function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return (
    <>
      <Suspense fallback={<div>loading..</div>}>
        <MembersHeader searchParams={searchParams} />
      </Suspense>
      <Suspense fallback={<div>loading..</div>}>
        <MembersFilterServer />
      </Suspense>
      <Suspense fallback={<div>loading..</div>}>
        <MembersList searchParams={searchParams} />
      </Suspense>
    </>
  )
}
