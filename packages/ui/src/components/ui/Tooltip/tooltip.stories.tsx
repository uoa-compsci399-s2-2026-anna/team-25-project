import type { Meta, StoryFn } from "@storybook/nextjs-vite"
import { PlusIcon } from "lucide-react"
import { Button } from "../Button/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip"

const meta: Meta<typeof Tooltip> = {
  title: "ui/Tooltip",
  component: Tooltip,
}

export default meta
type Story = StoryFn<typeof Tooltip>

export const Default: Story = () => (
  <Tooltip>
    <TooltipTrigger render={<Button variant="outline" />}>Hover me</TooltipTrigger>
    <TooltipContent>Add to library</TooltipContent>
  </Tooltip>
)

export const IconTrigger: Story = () => (
  <Tooltip>
    <TooltipTrigger render={<Button size="icon" variant="outline" />}>
      <PlusIcon />
    </TooltipTrigger>
    <TooltipContent>Create new item</TooltipContent>
  </Tooltip>
)

export const Sides: Story = () => (
  <div className="flex items-center gap-6">
    {(["top", "right", "bottom", "left"] as const).map((side) => (
      <Tooltip key={side}>
        <TooltipTrigger render={<Button variant="outline" />}>{side}</TooltipTrigger>
        <TooltipContent side={side}>Tooltip on the {side}</TooltipContent>
      </Tooltip>
    ))}
  </div>
)
