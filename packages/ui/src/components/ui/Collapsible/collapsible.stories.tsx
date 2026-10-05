import type { Meta, StoryFn } from "@storybook/nextjs-vite"
import { Button } from "../Button/button"
import { Collapsible, CollapsiblePanel, CollapsibleTrigger } from "./collapsible"

const meta: Meta<typeof Collapsible> = {
  title: "ui/Collapsible",
  component: Collapsible,
}

export default meta
type Story = StoryFn<typeof Collapsible>

export const Default: Story = () => (
  <Collapsible className="w-80">
    <CollapsibleTrigger render={<Button size="sm" variant="button-transparent" />}>
      Show details
    </CollapsibleTrigger>
    <CollapsiblePanel>
      <p className="pt-2 text-sm">The panel content shows here when the section is open.</p>
    </CollapsiblePanel>
  </Collapsible>
)
