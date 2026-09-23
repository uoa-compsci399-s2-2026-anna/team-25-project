import type { Meta, StoryFn } from "@storybook/nextjs-vite"
import { Button } from "../Button/button"
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
} from "./popover"

const meta: Meta<typeof Popover> = {
  title: "ui/Popover",
  component: Popover,
}

export default meta
type Story = StoryFn<typeof Popover>

export const Default: Story = () => (
  <Popover>
    <PopoverTrigger render={<Button variant="button-transparent" />}>Open popover</PopoverTrigger>
    <PopoverContent>
      <PopoverTitle>Dimensions</PopoverTitle>
      <PopoverDescription>Set the dimensions for the layer.</PopoverDescription>
    </PopoverContent>
  </Popover>
)

export const WithCloseButton: Story = () => (
  <Popover>
    <PopoverTrigger render={<Button variant="button-mauve" />}>Open popover</PopoverTrigger>
    <PopoverContent showCloseButton>
      <PopoverTitle>Dimensions</PopoverTitle>
      <PopoverDescription>Set the dimensions for the layer.</PopoverDescription>
    </PopoverContent>
  </Popover>
)

export const Sides: Story = () => (
  <div className="flex items-center gap-6">
    {(["top", "right", "bottom", "left"] as const).map((side) => (
      <Popover key={side}>
        <PopoverTrigger render={<Button variant="button-transparent" />}>{side}</PopoverTrigger>
        <PopoverContent side={side}>
          <PopoverTitle>On the {side}</PopoverTitle>
        </PopoverContent>
      </Popover>
    ))}
  </div>
)
