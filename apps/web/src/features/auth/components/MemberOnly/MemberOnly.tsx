import { redirect } from "next/navigation"
import { Suspense } from "react"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { Routes } from "@/lib/routes"

export async function MemberOnlyGate({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser()
  if (!user.user) {
    redirect(Routes.HOME)
  }

  return children
}

export function MemberOnly({
  children,
  fallback = null,
}: Readonly<{ children: React.ReactNode; fallback?: React.ReactNode }>) {
  return (
    <Suspense fallback={fallback}>
      <MemberOnlyGate>{children}</MemberOnlyGate>
    </Suspense>
  )
}
