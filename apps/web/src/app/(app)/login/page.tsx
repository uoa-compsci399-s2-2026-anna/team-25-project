import { GuestOnly } from "@/features/auth/components/GuestOnly/GuestOnly"
import { LoginForm } from "@/features/auth/components/LoginForm/LoginForm"

export default function Page() {
  return (
    <GuestOnly>
      <main className="mx-auto flex w-full max-w-xl flex-col gap-8 px-4 py-20">
        <LoginForm />
      </main>
    </GuestOnly>
  )
}
