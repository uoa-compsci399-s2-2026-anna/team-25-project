"use client"

import { Button, toast } from "@repo/ui/components/ui"
import { useRouter } from "next/navigation"
import type { ComponentProps } from "react"
import { logoutAction } from "@/features/auth/actions/logout"
import { Routes } from "@/lib/routes"

type LogoutButtonProps = Omit<ComponentProps<typeof Button>, "onClick">

export function LogoutButton({ children = "Logout", ...props }: LogoutButtonProps) {
  const router = useRouter()

  return (
    <Button
      {...props}
      onClick={async () => {
        const result = await logoutAction()
        if (result.success) {
          router.refresh()
          router.push(Routes.HOME)
        } else {
          toast.add({ title: "Logout failed", description: result.message })
        }
      }}
    >
      {children}
    </Button>
  )
}
