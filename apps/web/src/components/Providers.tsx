import { Toaster } from "@repo/ui/components/ui"
import { NuqsAdapter } from "nuqs/adapters/next/app"

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <NuqsAdapter>
      {children}
      <Toaster />
    </NuqsAdapter>
  )
}
