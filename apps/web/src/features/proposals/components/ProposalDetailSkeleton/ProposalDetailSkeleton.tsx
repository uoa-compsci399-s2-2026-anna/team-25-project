import { Skeleton } from "@repo/ui/components/ui"

export const ProposalDetailSkeleton = () => (
  <>
    <div className="flex flex-col gap-6">
      <Skeleton className="h-5 w-48 rounded-full" />
      <Skeleton className="h-10 w-3/4 rounded-md" />
      <Skeleton className="h-5 w-40 rounded-md" />
      <Skeleton className="h-24 w-full rounded-md" />
      <Skeleton className="h-64 w-full rounded-md" />
    </div>

    <div className="flex flex-col gap-6">
      <Skeleton className="h-48 w-full rounded-lg" />
    </div>
  </>
)
