import { Suspense } from "react"
import { LoginForm } from "@/features/auth/components/LoginForm/LoginForm"

export default function Page() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-8 px-4 py-20">
      {/* LoginForm reads the redirect search param, which is only known per request. */}
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  )
}
