"use server"

import config from "@payload-config"
import { login } from "@payloadcms/next/auth"
import { LockedAuth } from "payload"

export async function loginAction(email: string, password: string) {
  try {
    const result = await login({
      collection: "members",
      config,
      email,
      password,
    })

    return { success: true, result }
  } catch (error) {
    console.error("Login error:", error)
    if (error instanceof LockedAuth) {
      return { success: false, message: error.message }
    }
    return { success: false, message: "Invalid email or password" }
  }
}
