import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { Routes } from "@/lib/routes"

export async function MemberOnly({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser()
  if (!user.user) {
    redirect(Routes.HOME)
  }

  return children
}
