"use client"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  buttonVariants,
  Eyebrow,
  MenuToggleIcon,
} from "@repo/ui/components/ui"
import { cn } from "@repo/ui/lib/utils"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useId, useRef, useState } from "react"
import { LogoutButton } from "@/features/auth/components/LogoutButton/LogoutButton"
import { withRedirect } from "@/features/auth/redirect"
import type { AppRoute } from "@/lib/routes"
import { Routes } from "@/lib/routes"
import { useAuthRedirectTarget } from "./useAuthRedirectTarget"

export interface MobileNavAccount {
  name: string
  initials: string
  subtitle?: string
  avatarUrl?: string
  href: AppRoute
  hrefLabel: string
}

export interface MobileNavMenuProps {
  links: readonly { name: string; href: AppRoute }[]
  /** Omitted for guests. */
  account?: MobileNavAccount
}

// Tailwind's md breakpoint.
const DESKTOP_QUERY = "(min-width: 48rem)"

export function MobileNavMenu({ account, links }: MobileNavMenuProps) {
  const [open, setOpen] = useState(false)
  const panelId = useId()
  const toggleRef = useRef<HTMLButtonElement>(null)
  const pathname = usePathname()
  const close = () => setOpen(false)

  // Close whenever the page changes (link, back button, logout).
  // biome-ignore lint/correctness/useExhaustiveDependencies: closes on every pathname change
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return
      setOpen(false)
      toggleRef.current?.focus()
    }
    // The toggle is hidden from md up, so close rather than leave the sheet stuck open.
    const desktop = window.matchMedia(DESKTOP_QUERY)
    const onBreakpoint = () => {
      if (desktop.matches) setOpen(false)
    }
    const { overflow } = document.body.style
    document.body.style.overflow = "hidden"
    // The sheet covers the page, so keep Tab out of the content and footer behind
    // it - stopping at the footer leaves portals and Next's route announcer alone.
    const behind: Element[] = []
    let element = toggleRef.current?.closest("header")?.nextElementSibling
    for (; element; element = element.nextElementSibling) {
      if (!element.hasAttribute("inert")) behind.push(element)
      if (element.tagName === "FOOTER") break
    }
    for (const page of behind) page.setAttribute("inert", "")

    document.addEventListener("keydown", onKeyDown)
    desktop.addEventListener("change", onBreakpoint)
    return () => {
      document.body.style.overflow = overflow
      for (const page of behind) page.removeAttribute("inert")
      document.removeEventListener("keydown", onKeyDown)
      desktop.removeEventListener("change", onBreakpoint)
    }
  }, [open])

  return (
    <>
      <button
        aria-controls={panelId}
        aria-expanded={open}
        aria-label={open ? "Close menu" : "Open menu"}
        className="-m-2 cursor-pointer p-2 pr-4 text-brand-charcoal transition-opacity hover:opacity-70"
        onClick={() => setOpen((value) => !value)}
        ref={toggleRef}
        type="button"
      >
        <MenuToggleIcon open={open} />
      </button>

      {/* Stays mounted so it can fade out; inert hides it while closed. top-full
          and 100% resolve against the sticky header, filling the viewport below it. */}
      <div
        className={cn(
          "absolute inset-x-0 top-full flex h-[calc(100dvh-100%)] flex-col overflow-y-auto border-border border-t bg-brand-cream transition-all duration-150 ease-out motion-reduce:transition-none",
          open ? "visible opacity-100" : "invisible opacity-0",
        )}
        data-state={open ? "open" : "closed"}
        id={panelId}
        inert={!open}
      >
        {account && (
          <div className="flex items-center gap-3 border-border border-b px-4 py-5">
            <Avatar size="lg">
              {account.avatarUrl && <AvatarImage alt="" src={account.avatarUrl} />}
              <AvatarFallback>{account.initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate font-medium text-base">{account.name}</p>
              {account.subtitle && (
                <p className="truncate text-muted-foreground text-sm">{account.subtitle}</p>
              )}
            </div>
          </div>
        )}

        <nav aria-label="Mobile" className="flex flex-col px-4 py-5">
          <Eyebrow className="pb-3">Browse</Eyebrow>
          {links.map((link) => {
            const current = pathname === link.href || pathname.startsWith(`${link.href}/`)
            return (
              <Link
                aria-current={current ? "page" : undefined}
                className={cn(
                  "-mx-2 rounded-lg px-2 py-2.5 text-lg transition-colors hover:bg-brand-blush",
                  current && "bg-brand-blush font-medium",
                )}
                href={link.href}
                key={link.name}
                onClick={close}
              >
                {link.name}
              </Link>
            )
          })}
        </nav>

        <div className="mt-auto flex flex-col gap-2 border-border border-t px-4 py-5">
          {account ? (
            <>
              <Button
                className="w-full"
                nativeButton={false}
                onClick={close}
                render={<Link href={account.href} />}
                size="xl"
              >
                {account.hrefLabel}
              </Button>
              <LogoutButton className="w-full" size="xl" variant="button-transparent">
                Log out
              </LogoutButton>
            </>
          ) : (
            <GuestActions onNavigate={close} />
          )}
        </div>
      </div>
    </>
  )
}

const GuestActions = ({ onNavigate }: { onNavigate: () => void }) => {
  const target = useAuthRedirectTarget()

  return (
    <>
      <Link
        className={buttonVariants({ className: "w-full", size: "xl" })}
        href={withRedirect(Routes.REGISTER.ROOT, target)}
        onClick={onNavigate}
      >
        Join CCCA
      </Link>
      <Link
        className={buttonVariants({
          className: "w-full",
          size: "xl",
          variant: "button-transparent",
        })}
        href={withRedirect(Routes.LOGIN, target)}
        onClick={onNavigate}
      >
        Log in
      </Link>
    </>
  )
}
