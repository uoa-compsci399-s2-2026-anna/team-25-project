"use server"

import config from "@payload-config"
import { logout } from "@payloadcms/next/auth"
import { APIError } from "payload"

export async function logoutAction(): Promise<
  { success: true } | { success: false; message: string }
> {
  try {
    await logout({ allSessions: true, config })
    return { success: true }
  } catch (error) {
    console.error("Logout error:", error)
    if (error instanceof APIError) {
      return {
        success: false,
        message: "Your session has already ended. Refresh the page and try again.",
      }
    }
    return { success: false, message: "We couldn't log you out. Try again later." }
  }
}
