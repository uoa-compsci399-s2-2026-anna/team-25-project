import type { Metadata } from "next"
import { notFound } from "next/navigation"

export const metadata: Metadata = { title: "Page not found" }

export const instant = false

export default function NotFoundPage() {
  notFound()
}
