"use client"

import {
  Button,
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from "@repo/ui/components/ui"
import Link from "next/link"
import type { ReactNode } from "react"
import { LogoutButton } from "@/features/auth/components/LogoutButton/LogoutButton"
import type { AppRoute } from "@/lib/routes"

export interface NavUserMenuProps {
  /** The trigger's contents - the name and avatar, rendered by NavAuthStatus. */
  children: ReactNode
  /** Omitted for an admin, who has no member directory entry to point at. */
  profileHref?: AppRoute
}

export function NavUserMenu({ children, profileHref }: NavUserMenuProps) {
  return (
    <Popover>
      <PopoverTrigger className="flex min-w-0 cursor-pointer items-center gap-2 transition-opacity hover:opacity-70">
        {children}
      </PopoverTrigger>

      <PopoverContent align="end" className="w-44 gap-1">
        <PopoverTitle className="sr-only">Account</PopoverTitle>

        {/* Wrapped in PopoverClose so following the link also dismisses the menu -
            navigating on its own leaves it open behind the new page. */}
        {profileHref && (
          <PopoverClose
            nativeButton={false}
            render={
              <Button
                className="w-full justify-start"
                nativeButton={false}
                render={<Link href={profileHref} />}
                variant="button-transparent"
              />
            }
          >
            Profile
          </PopoverClose>
        )}

        <LogoutButton className="w-full justify-start" variant="button-transparent">
          Log out
        </LogoutButton>
      </PopoverContent>
    </Popover>
  )
}
