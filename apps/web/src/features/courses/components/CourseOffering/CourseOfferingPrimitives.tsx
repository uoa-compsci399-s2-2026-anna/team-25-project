import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/ui"
import type { ReactNode } from "react"

const labelClassName = "font-semibold text-muted-foreground text-xs uppercase tracking-widest"

export const CourseOfferingSection = ({
  children,
  title,
}: {
  children: ReactNode
  title: string
}) => (
  <section className="flex flex-col gap-2">
    <h3 className={labelClassName}>{title}</h3>
    {children}
  </section>
)

export const CourseOfferingDetail = ({ label, value }: { label: string; value: ReactNode }) => (
  <div className="flex flex-col gap-1">
    <p className={labelClassName}>{label}</p>
    <p className="text-sm">{value}</p>
  </div>
)

export const CourseOfferingSidebarCard = ({
  children,
  title,
}: {
  children: ReactNode
  title: string
}) => (
  <Card>
    <CardHeader>
      <CardTitle className={labelClassName}>{title}</CardTitle>
    </CardHeader>
    <CardContent className="gap-3 self-stretch">{children}</CardContent>
  </Card>
)
