import type { Metadata } from "next"
import "@repo/ui/globals.css"
import { cn } from "@repo/ui/lib/utils"
import { Providers } from "@/components/Providers"
import { Footer, Navbar } from "@/features/layout/components"
import { fontMono, satoshi } from "@/lib/fonts"
import { siteUrl } from "@/lib/siteUrl"

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: { default: "Computing Capstone Community Australasia", template: "%s | CCCA" },
  description: "A community for computing capstone educators in Australasia.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html className={cn("antialiased", fontMono.variable, "font-sans", satoshi.variable)} lang="en">
      {/* overflow-x-clip (not overflow-x-hidden) so full-bleed sections that break out
          via 100vw (e.g. InstitutionsTicker) can't push the page into horizontal
          scroll on platforms with a classic, non-overlay scrollbar - x-only so it
          doesn't disable Navbar's vertical position:sticky. */}
      <body className="flex min-h-dvh flex-col items-center overflow-x-clip">
        <Providers>
          <Navbar />
          <div className="w-full flex-1">{children}</div>
          <Footer />
        </Providers>
      </body>
    </html>
  )
}
