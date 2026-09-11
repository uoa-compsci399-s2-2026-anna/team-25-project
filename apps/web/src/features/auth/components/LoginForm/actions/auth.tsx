"use server"

import config from "@payload-config"
import { login } from "@payloadcms/next/auth"

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
    return { success: false, message: "Invalid email or password" }
  }
}
