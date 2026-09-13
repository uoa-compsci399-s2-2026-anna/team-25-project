import { redirect } from "next/navigation"
import { Suspense } from "react"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { Slugs } from "@/lib/payload/slugs"
import { Routes } from "@/lib/routes"

export async function AdminOnlyGate({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser()
  if (!user.user || user.collection !== Slugs.Collections.ADMIN) {
    redirect(Routes.HOME)
  }

  return children
}

export function AdminOnly({
  children,
  fallback = null,
}: Readonly<{ children: React.ReactNode; fallback?: React.ReactNode }>) {
  return (
    <Suspense fallback={fallback}>
      <AdminOnlyGate>{children}</AdminOnlyGate>
    </Suspense>
  )
}
