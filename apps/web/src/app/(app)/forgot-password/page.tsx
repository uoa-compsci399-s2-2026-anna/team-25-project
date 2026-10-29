import type { Metadata } from "next"
import { Suspense } from "react"
import { ForgotPasswordForm } from "@/features/auth/components"

export const metadata: Metadata = {
  title: "Reset your password",
  description: "Get a link to set a new password for your CCCA account.",
}

export default function Page() {
  return (
    // ForgotPasswordForm reads the email search param, which is only known per request.
    <Suspense>
      <ForgotPasswordForm />
    </Suspense>
  )
}
