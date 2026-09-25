import { Geist_Mono } from "next/font/google"
import localFont from "next/font/local"
import "@repo/ui/globals.css"
import { cn } from "@repo/ui/lib/utils"
import { Providers } from "@/components/Providers"
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
      <body className="flex min-h-dvh flex-col items-center">
        <Providers>
          <Navbar />
          <div className="w-full flex-1">{children}</div>
          <Footer />
        </Providers>
      </body>
    </html>
  )
}
