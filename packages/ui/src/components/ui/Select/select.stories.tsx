import { cn } from "@repo/ui/lib/utils"
import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import * as React from "react"
import { buttonVariants } from "../Button/button"
import { Label } from "../Label/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "./select"

const meta: Meta<typeof Select> = {
  title: "ui/Select",
  component: Select,
}

export default meta
type Story = StoryObj<typeof Select>

export const Primary: Story = {
  render: () => (
    <Select>
      <SelectTrigger>
        <SelectValue placeholder="Select a fruit" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="Apple">Apple</SelectItem>
        <SelectItem value="Banana">Banana</SelectItem>
        <SelectItem value="Cherry">Cherry</SelectItem>
      </SelectContent>
    </Select>
  ),
}

function rowItemClassName(active: boolean) {
  return cn(
    buttonVariants({ variant: "button-cream" }),
    "w-fit [&_svg]:hidden",
    active && "bg-brand-salmon/40",
  )
}

export const Row: Story = {
  render: () => {
    function ToggleRow() {
      const [value, setValue] = React.useState<string | null>("")
      return (
        <Select modal={false} onValueChange={setValue} open value={value}>
          <div className="inline-flex items-center gap-1">
            <SelectItem className={rowItemClassName(value === "University")} value="University">
              University
            </SelectItem>
            <SelectItem className={rowItemClassName(value === "Country")} value="Country">
              Country
            </SelectItem>
            <SelectItem
              className={rowItemClassName(value === "Research Interest")}
              value="Research Interest"
            >
              Research Interest
            </SelectItem>
          </div>
        </Select>
      )
    }
    return <ToggleRow />
  },
}

export const Groups: Story = {
  render: () => (
    <Select>
      <SelectTrigger>
        <SelectValue placeholder="Select a food" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Fruits</SelectLabel>
          <SelectItem value="Apple">Apple</SelectItem>
          <SelectItem value="Banana">Banana</SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <SelectLabel>Vegetables</SelectLabel>
          <SelectItem value="Carrot">Carrot</SelectItem>
          <SelectItem value="Potato">Potato</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  ),
}

export const Disabled: Story = {
  render: () => {
    const id = React.useId()
    return (
      <div className="flex flex-col gap-2">
        <Label htmlFor={id}>Fruit</Label>
        <Select disabled>
          <SelectTrigger id={id}>
            <SelectValue placeholder="Select a fruit" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Apple">Apple</SelectItem>
            <SelectItem value="Banana">Banana</SelectItem>
          </SelectContent>
        </Select>
      </div>
    )
  },
}

export const Invalid: Story = {
  render: () => (
    <Select>
      <SelectTrigger aria-invalid>
        <SelectValue placeholder="Select a fruit" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="Apple">Apple</SelectItem>
      </SelectContent>
    </Select>
  ),
}

export const Controlled: Story = {
  render: () => {
    function ControlledSelect() {
      const [value, setValue] = React.useState<string | null>(null)
      return (
        <div className="flex flex-col gap-2">
          <Select onValueChange={setValue} value={value}>
            <SelectTrigger>
              <SelectValue placeholder="Select a fruit" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Apple">Apple</SelectItem>
              <SelectItem value="Banana">Banana</SelectItem>
              <SelectItem value="Cherry">Cherry</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-muted-foreground text-sm">Selected: {value ?? "none"}</p>
        </div>
      )
    }
    return <ControlledSelect />
  },
}

const SelectOptions = Array.from({ length: 50 }, (_, i) => ({
  value: `Apple-${i}`,
  label: "Apple",
}))

export const LargeList: Story = {
  render: () => (
    <Select>
      <SelectTrigger>
        <SelectValue placeholder="Select a fruit" />
      </SelectTrigger>
      <SelectContent>
        {SelectOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  ),
}
