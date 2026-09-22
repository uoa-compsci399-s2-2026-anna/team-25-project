"use server"

import config from "@payload-config"
import { logout } from "@payloadcms/next/auth"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"

export async function logoutAction(): Promise<{ success: boolean; message: string }> {
  try {
    const session = await getCurrentUser()
    if (session.user) {
      const result = await logout({ allSessions: true, config })
      if (result.success) {
        return { success: true, message: result.message }
      }
      return { success: false, message: "We couldn't log you out. Try again later." }
    }
    return { success: false, message: "No session found" }
  } catch (error) {
    console.error("Logout error:", error)
    return { success: false, message: "We couldn't log you out. Try again later." }
  }
}
