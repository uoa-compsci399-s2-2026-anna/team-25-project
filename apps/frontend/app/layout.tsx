import { Geist, Geist_Mono } from "next/font/google"

import "@repo/ui/globals.css"
import { cn } from "@repo/ui/lib/utils"

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html className={cn("antialiased", fontMono.variable, "font-sans", geist.variable)} lang="en">
      <body>{children}</body>
    </html>
  )
}
