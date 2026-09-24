import type { Meta, StoryFn } from "@storybook/nextjs-vite"
import { Avatar, AvatarFallback } from "../Avatar/avatar"
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
  <div className="flex min-h-96 items-center justify-center gap-6 p-24">
    {(["top", "right", "bottom", "left"] as const).map((side) => (
      <Popover key={side}>
        <PopoverTrigger render={<Button variant="button-transparent" />}>{side}</PopoverTrigger>
        <PopoverContent
          className="w-auto"
          collisionAvoidance={{ align: "none", side: "none" }}
          side={side}
        >
          <PopoverTitle>On the {side}</PopoverTitle>
        </PopoverContent>
      </Popover>
    ))}
  </div>
)

const mockMember = {
  email: "maya.chen@example.ac.nz",
  initials: "MC",
  name: "Maya Chen",
}

export const AccountMenu: Story = () => (
  <div className="flex justify-end">
    <Popover>
      <PopoverTrigger nativeButton={false} render={<Avatar className="cursor-pointer" />}>
        <AvatarFallback>{mockMember.initials}</AvatarFallback>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-52 gap-2">
        <PopoverTitle>{mockMember.name}</PopoverTitle>
        <PopoverDescription>{mockMember.email}</PopoverDescription>
        <Button className="mt-2" variant="button-transparent">
          Log out
        </Button>
      </PopoverContent>
    </Popover>
  </div>
)
