import { Heading } from "@repo/ui/components/ui"
import { Suspense } from "react"
import { LoginForm } from "@/features/auth/components/LoginForm/LoginForm"

export default function Page() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-8 px-4 py-20">
      <div className="flex flex-col gap-3 text-center">
        <Heading level="h1">Welcome Back</Heading>
        <p className="text-muted-foreground">
          Log in to see proposals, course data and member contact details.
        </p>
      </div>

      {/* LoginForm reads the redirect search param, which is only known per request. */}
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  )
}
