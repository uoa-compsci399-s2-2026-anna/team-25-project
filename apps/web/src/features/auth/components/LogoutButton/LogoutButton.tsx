"use client"

import { Button, toast } from "@repo/ui/components/ui"
import { useRouter } from "next/navigation"
import { type ComponentProps, useTransition } from "react"
import { logoutAction } from "@/features/auth/actions/logout"
import { Routes } from "@/lib/routes"

type LogoutButtonProps = Omit<ComponentProps<typeof Button>, "onClick">

export function LogoutButton({ children = "Logout", ...props }: LogoutButtonProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleLogout = () => {
    startTransition(async () => {
      try {
        const result = await logoutAction()
        if (result.success) {
          router.refresh()
          router.push(Routes.HOME)
          toast.add({ title: "Successfully Logged Out", description: result.message })
        } else {
          toast.add({ title: "Logout failed", description: result.message })
        }
      } catch {
        toast.add({
          title: "Logout failed",
          description: "We couldn't reach the server. Check your connection and try again.",
        })
      }
    })
  }

  return (
    <Button {...props} disabled={props.disabled || isPending} onClick={handleLogout}>
      {children}
    </Button>
  )
}
