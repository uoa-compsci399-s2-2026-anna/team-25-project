import { Geist_Mono } from "next/font/google"
import localFont from "next/font/local"

export const satoshi = localFont({
  src: [
    { path: "./fonts/Satoshi-Variable.ttf", weight: "300 900", style: "normal" },
    { path: "./fonts/Satoshi-VariableItalic.ttf", weight: "300 900", style: "italic" },
  ],
  variable: "--font-sans",
})

export const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})
