import { Toaster } from "@repo/ui/components/ui"
import { NuqsAdapter } from "nuqs/adapters/next/app"
import { Devtools } from "@/components/Devtools"

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <NuqsAdapter>
      {children}
      <Toaster />
      {process.env.NODE_ENV === "development" && <Devtools />}
    </NuqsAdapter>
  )
}
