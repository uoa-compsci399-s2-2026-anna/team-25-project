import { Geist_Mono } from "next/font/google"
import localFont from "next/font/local"

import "@repo/ui/globals.css"
import { Toaster } from "@repo/ui/components/ui"
import { cn } from "@repo/ui/lib/utils"
import { Footer, Navbar } from "@/features/layout/components"

const satoshi = localFont({
  src: [
    { path: "./fonts/Satoshi-Variable.ttf", weight: "300 900", style: "normal" },
    { path: "./fonts/Satoshi-VariableItalic.ttf", weight: "300 900", style: "italic" },
  ],
  variable: "--font-sans",
})

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
    <html className={cn("antialiased", fontMono.variable, "font-sans", satoshi.variable)} lang="en">
      <body>
        <Toaster>
          <Navbar />
          {children}
          <Footer />
        </Toaster>
      </body>
    </html>
  )
}
