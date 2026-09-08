import { Badge, Heading } from "@repo/ui/components/ui"
import { cn } from "@repo/ui/lib/utils"

export const MemberBenefitCard = ({
  description,
  membersOnly,
  swatchClassName,
  title,
}: {
  description: string
  membersOnly?: boolean
  swatchClassName: string
  title: string
}) => {
  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-brand-blush/60 p-6">
      <div className={cn("size-12 rounded-lg", swatchClassName)} />
      <div className="flex items-center gap-2">
        <Heading level="h4">{title}</Heading>
        {membersOnly && <Badge variant="charcoal">MEMBERS</Badge>}
      </div>
      <p className="text-muted-foreground">{description}</p>
    </div>
  )
}
