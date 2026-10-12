import type { Meta, StoryFn } from "@storybook/nextjs-vite"
import { FolderOpen } from "lucide-react"
import { Button } from "../Button/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "./empty"

const meta: Meta<typeof Empty> = {
  title: "ui/Empty",
  component: Empty,
}

export default meta
type Story = StoryFn<typeof Empty>

export const Primary: Story = (args) => (
  <Empty {...args} className="w-96 border">
    <EmptyHeader>
      <EmptyMedia variant="icon">
        <FolderOpen />
      </EmptyMedia>
      <EmptyTitle>No proposals yet</EmptyTitle>
      <EmptyDescription>Post a proposal to find collaborators for your research.</EmptyDescription>
    </EmptyHeader>
    <EmptyContent>
      <Button variant="button-mauve">Post a proposal</Button>
    </EmptyContent>
  </Empty>
)

export const TextOnly: Story = (args) => (
  <Empty {...args} className="w-96">
    <EmptyHeader>
      <EmptyTitle>No results</EmptyTitle>
      <EmptyDescription>Try a different search or clear your filters.</EmptyDescription>
    </EmptyHeader>
  </Empty>
)
