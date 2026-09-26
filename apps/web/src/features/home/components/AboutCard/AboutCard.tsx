import { Heading } from "@repo/ui/components/ui"

export const AboutCard = ({
  description,
  number,
  title,
}: {
  description: string
  /** Shown above the title, e.g. "01". */
  number: string
  title: string
}) => {
  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-brand-blush/60 p-6">
      <span className="font-bold text-primary text-xl">{number}</span>
      <Heading level="h3">{title}</Heading>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  )
}
