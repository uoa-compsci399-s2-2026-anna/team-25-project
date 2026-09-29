import { Skeleton } from "@repo/ui/components/ui"
import { PageHeader, type PageHeaderProps } from "./PageHeader"

const descriptionPlaceholder = (
  <div className="flex w-full flex-col gap-4">
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-2/3" />
  </div>
)

/** Fills what still waits on data with `Skeleton`s. Pass `description` or `actions` for parts that don't. */
export function PageHeaderSkeleton({
  description = descriptionPlaceholder,
  ...props
}: Omit<PageHeaderProps, "description"> & Partial<Pick<PageHeaderProps, "description">>) {
  return <PageHeader description={description} {...props} />
}
