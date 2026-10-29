import { ShieldCheck } from "lucide-react"
import Link from "next/link"
import { getCurrentUser } from "@/lib/payload/getCurrentUser"
import { Slugs } from "@/lib/payload/slugs"
import { Routes } from "@/lib/routes"

// Reads the session, so Navbar streams it in behind its own Suspense
// boundary - members and guests get nothing, so there's no space to hold.
export const AdminBanner = async () => {
  const { collection } = await getCurrentUser()

  if (collection !== Slugs.Collections.ADMIN) return null

  return (
    <aside
      aria-label="Admin mode"
      className="flex w-full items-center justify-center gap-2 bg-brand-plum px-4 py-2 text-sm text-white md:px-8"
    >
      <ShieldCheck aria-hidden className="size-4 shrink-0" />
      <p>
        You&apos;re signed in as an admin.{" "}
        <Link className="font-medium underline underline-offset-4" href={Routes.ADMIN}>
          Open the admin dashboard
        </Link>
      </p>
    </aside>
  )
}
