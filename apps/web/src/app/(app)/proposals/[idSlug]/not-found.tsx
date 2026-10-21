import { Lightbulb } from "lucide-react"
import { EmptyState } from "@/components/EmptyState"
import { Routes } from "@/lib/routes"

export default function NotFound() {
  return (
    <EmptyState
      action={{ href: Routes.PROPOSALS.ROOT, label: "Browse proposals" }}
      description="The proposal was removed, or the link is no longer valid."
      icon={<Lightbulb />}
      title="This proposal is not available"
      variant="page"
    />
  )
}
