import { GraduationCap } from "lucide-react"
import { EmptyState } from "@/components/EmptyState"
import { Routes } from "@/lib/routes"

export default function NotFound() {
  return (
    <EmptyState
      action={{ href: Routes.COURSES.ROOT, label: "Browse courses" }}
      className="p-10 md:p-24"
      description="The course was removed, or it has no published offering yet."
      icon={<GraduationCap />}
      title="This course is not available"
    />
  )
}
