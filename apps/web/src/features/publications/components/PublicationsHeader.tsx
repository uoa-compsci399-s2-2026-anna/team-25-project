import { PageHeader } from "@/features/layout/components"
import { AddPublicationTrigger } from "./AddPublicationTrigger"

export const PublicationsHeader = () => {
  return (
    <PageHeader
      actions={<AddPublicationTrigger />}
      description="Papers, theses and reports on computing capstones, written by members and their co-authors."
      title="Publications"
    />
  )
}
