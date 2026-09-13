import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { Slugs } from "@/lib/payload/slugs"
import { Routes } from "@/lib/routes"

export async function AdminOnly({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser()
  if (!user.user || user.collection !== Slugs.Collections.ADMIN) {
    redirect(Routes.HOME)
  }

  return children
}
