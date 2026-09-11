import { Heading } from "@repo/ui/components/ui"
import { redirect } from "next/navigation"
import { Suspense } from "react"
import {
  RegisterProfileForm,
  RegisterProfileSkeleton,
  RegisterStepper,
} from "@/features/auth/components"
import { initials } from "@/lib/initials"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { Slugs } from "@/lib/payload/slugs"
import { Routes } from "@/lib/routes"

/**
 * Isolated so only this reads headers() (via getCurrentUser) - the heading and
 * stepper around it stay prerenderable, matching how NavAuthStatus is split.
 */
const ProfileFormSection = async () => {
  const { collection, user } = await getCurrentUser()

  // Reaching step two without an account means step one never completed.
  if (collection !== Slugs.Collections.MEMBERS) {
    redirect(Routes.REGISTER)
  }

  return <RegisterProfileForm initials={initials(user.firstName, user.lastName)} />
}

export default function Page() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-8 px-4 py-16">
      <RegisterStepper current={2} />

      <div className="flex flex-col gap-3 text-center">
        <Heading level="h1">Complete your profile</Heading>
        <p className="text-muted-foreground">
          This is what other members see in the directory. Everything here can be changed later.
        </p>
      </div>

      <Suspense fallback={<RegisterProfileSkeleton />}>
        <ProfileFormSection />
      </Suspense>
    </main>
  )
}
