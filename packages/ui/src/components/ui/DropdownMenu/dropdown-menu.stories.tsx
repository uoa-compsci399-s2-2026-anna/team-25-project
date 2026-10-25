import type { Meta, StoryFn } from "@storybook/nextjs-vite"
import { EllipsisVerticalIcon } from "lucide-react"
import { Button } from "../Button/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu"

const meta: Meta<typeof DropdownMenu> = {
  title: "ui/DropdownMenu",
  component: DropdownMenu,
}

export default meta
type Story = StoryFn<typeof DropdownMenu>

export const Default: Story = () => (
  <DropdownMenu>
    <DropdownMenuTrigger render={<Button variant="button-transparent" />}>
      Open menu
    </DropdownMenuTrigger>
    <DropdownMenuContent>
      <DropdownMenuItem>Edit</DropdownMenuItem>
      <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
)

export const KebabTrigger: Story = () => (
  <DropdownMenu>
    <DropdownMenuTrigger
      aria-label="Open actions menu"
      render={<Button size="icon-sm" variant="button-transparent" />}
    >
      <EllipsisVerticalIcon aria-hidden="true" />
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem>Edit</DropdownMenuItem>
      <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
)
