import { initials } from "@repo/shared/utils/initials"
import { Heading } from "@repo/ui/components/ui"
import { redirect } from "next/navigation"
import type { SearchParams } from "nuqs/server"
import { Suspense } from "react"
import {
  RegisterProfileForm,
  RegisterProfileSkeleton,
  RegisterStepper,
} from "@/features/auth/components"
import { loadRedirectParam, redirectTarget, withRedirect } from "@/features/auth/redirect"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { Slugs } from "@/lib/payload/slugs"
import { Routes } from "@/lib/routes"

/**
 * Isolated so only this reads headers() (via getCurrentUser) - the heading and
 * stepper around it stay prerenderable, matching how NavAuthStatus is split.
 */
const ProfileFormSection = async ({ searchParams }: { searchParams: Promise<SearchParams> }) => {
  const [{ collection, user }, { redirect: redirectParam }] = await Promise.all([
    getCurrentUser(),
    loadRedirectParam(searchParams),
  ])

  // Reaching step two without an account means step one never completed.
  if (collection !== Slugs.Collections.MEMBERS) {
    redirect(withRedirect(Routes.REGISTER.ROOT, redirectParam))
  }

  // Already finished the profile step
  if (user.registrationCompletedAt) {
    redirect(redirectTarget(redirectParam))
  }

  return <RegisterProfileForm initials={initials(user.firstName, user.lastName)} />
}

export default function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-8 px-4 py-20">
      <RegisterStepper current={2} />

      <div className="flex flex-col gap-3 text-center">
        <Heading level="h1">Complete your profile</Heading>
        <p className="text-muted-foreground">
          This is what other members see in the directory. Everything here can be changed later.
        </p>
      </div>

      <Suspense fallback={<RegisterProfileSkeleton />}>
        <ProfileFormSection searchParams={searchParams} />
      </Suspense>
    </main>
  )
}
