import { Badge, Card, CardContent, CardHeader, Heading } from "@repo/ui/components/ui"

// TODO: map the member's publications into cards like MemberProposals once there's a collection
export const MemberPublications = () => (
  <section className="flex flex-col gap-4">
    <Heading level="h2">Publications</Heading>
    <Card>
      <CardHeader className="flex items-center justify-between gap-3">
        <Badge className="uppercase tracking-wide" variant="blue">
          Publication
        </Badge>
        <span className="text-muted-foreground text-xs">Published —</span>
      </CardHeader>
      <CardContent className="text-muted-foreground">No publications yet</CardContent>
    </Card>
  </section>
)
