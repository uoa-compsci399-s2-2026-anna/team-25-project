import type { Metadata } from "next"
import type { SearchParams } from "nuqs/server"
import { Suspense } from "react"
import { ResetLinkInvalid, ResetPasswordForm } from "@/features/auth/components"
import { isResetTokenLive } from "@/features/auth/helpers/resetToken"

export const metadata: Metadata = {
  title: "Set a new password",
  description: "Choose a new password for your CCCA account.",
}

/**
 * Checks the link before showing anything, so a dead one gets its own screen
 * rather than a form it can't submit. Isolated so only this reads the URL.
 */
const ResetSection = async ({ searchParams }: { searchParams: Promise<SearchParams> }) => {
  const { token } = await searchParams
  if (typeof token !== "string" || !(await isResetTokenLive(token))) {
    return <ResetLinkInvalid />
  }
  return <ResetPasswordForm token={token} />
}

export default function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return (
    <Suspense>
      <ResetSection searchParams={searchParams} />
    </Suspense>
  )
}
