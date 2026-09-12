"use server"

import config from "@payload-config"
import { login } from "@payloadcms/next/auth"
import { AuthenticationError, LockedAuth } from "payload"
import { loginFormSchema } from "@/features/auth/zod/loginFormSchema"
import { Slugs } from "@/lib/payload/slugs"

export async function loginAction(
  email: string,
  password: string,
): Promise<{ success: true } | { success: false; message: string }> {
  const parsed = loginFormSchema.safeParse({ email, password })
  if (!parsed.success) {
    return { success: false, message: "Invalid email or password" }
  }

  try {
    await login({
      collection: Slugs.Collections.MEMBERS,
      config,
      email: parsed.data.email,
      password: parsed.data.password,
    })

    return { success: true }
  } catch (error) {
    console.error("Login error:", error)
    if (error instanceof LockedAuth) {
      return { success: false, message: error.message }
    }
    if (error instanceof AuthenticationError) {
      return { success: false, message: "Invalid email or password" }
    }
    return { success: false, message: "We couldn't log you in. Try again later." }
  }
}
