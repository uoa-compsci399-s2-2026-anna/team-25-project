import { FolderOpen } from "lucide-react"
import { EmptyState } from "@/components/EmptyState"
import { Routes } from "@/lib/routes"

export default function NotFound() {
  return (
    <EmptyState
      action={{ href: Routes.RESOURCES.ROOT, label: "Browse resources" }}
      className="p-10 md:p-24"
      description="The resource was removed, or the link is no longer valid."
      icon={<FolderOpen />}
      title="This resource is not available"
    />
  )
}
