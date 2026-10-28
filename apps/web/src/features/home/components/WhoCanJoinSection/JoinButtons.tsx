import { Button, Skeleton } from "@repo/ui/components/ui"
import Link from "next/link"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { Routes } from "@/lib/routes"

export const JoinButtons = async () => {
  const { user } = await getCurrentUser()

  if (user) {
    return (
      <div className="flex flex-wrap items-center gap-2 pl-8 sm:gap-4">
        <Button
          borderColor="charcoal"
          nativeButton={false}
          render={<Link href={Routes.MEMBERS.ROOT} />}
          variant="button-transparent"
        >
          View Members
        </Button>
      </div>
    )
  }

  return <GuestJoinButtons />
}

/** What JoinButtons shows to a guest, and falls back to when the user cannot be read. */
export const GuestJoinButtons = () => (
  <div className="flex flex-wrap items-center gap-2 pl-8 sm:gap-4">
    <Button
      borderColor="mauve"
      nativeButton={false}
      render={<Link href={Routes.REGISTER.ROOT} />}
      variant="button-mauve"
    >
      Register with your uni email
    </Button>
    <Button
      borderColor="charcoal"
      nativeButton={false}
      render={<Link href={Routes.LOGIN} />}
      variant="button-transparent"
    >
      Log in
    </Button>
  </div>
)

// Matches the signed-out layout, which most visitors see.
export const JoinButtonsSkeleton = () => (
  <div className="flex flex-wrap items-center gap-2 pl-8 sm:gap-4">
    <Skeleton className="h-7 w-52 rounded-full" />
    <Skeleton className="h-7 w-16 rounded-full" />
  </div>
)
