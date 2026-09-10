import type { Meta, StoryFn } from "@storybook/nextjs-vite"
import type { ComponentProps } from "react"
import * as React from "react"
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

const variants = ["filter", "input"] as const

type StoryArgs = ComponentProps<typeof Select<string>> & {
  variant?: (typeof variants)[number]
}

const meta: Meta<typeof Select> = {
  title: "ui/Select",
  component: Select,
  argTypes: {
    variant: {
      control: { type: "select" },
      options: variants,
    },
  },
}

export default meta
type Story = StoryFn<StoryArgs>

export const Primary: Story = ({ variant, ...args }) => (
  <Select {...args}>
    <SelectTrigger variant={variant}>
      <SelectValue placeholder="Select a fruit" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="Apple">Apple</SelectItem>
      <SelectItem value="Banana">Banana</SelectItem>
      <SelectItem value="Cherry">Cherry</SelectItem>
    </SelectContent>
  </Select>
)

export const Filter: Story = ({ variant, ...args }) => (
  <div className="inline-flex items-center gap-1">
    <Select {...args}>
      <SelectTrigger className="w-fit" variant={variant}>
        <SelectValue placeholder="Select a fruit" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="Apple">Apple</SelectItem>
      </SelectContent>
    </Select>
  </div>
)
Filter.args = { variant: "filter" }

export const Groups: Story = ({ variant, ...args }) => (
  <Select {...args}>
    <SelectTrigger variant={variant}>
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
)

export const Disabled: Story = ({ variant, ...args }) => {
  const id = React.useId()
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>Fruit</Label>
      <Select {...args} disabled>
        <SelectTrigger id={id} variant={variant}>
          <SelectValue placeholder="Select a fruit" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Apple">Apple</SelectItem>
          <SelectItem value="Banana">Banana</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}

export const Invalid: Story = ({ variant, ...args }) => (
  <Select {...args}>
    <SelectTrigger aria-invalid variant={variant}>
      <SelectValue placeholder="Select a fruit" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="Apple">Apple</SelectItem>
    </SelectContent>
  </Select>
)

function ControlledSelect({ variant, ...args }: StoryArgs) {
  const [value, setValue] = React.useState<string | null>(null)
  return (
    <div className="flex flex-col gap-2">
      <Select {...args} onValueChange={setValue} value={value}>
        <SelectTrigger variant={variant}>
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

export const Controlled: Story = (args) => <ControlledSelect {...args} />

const SelectOptions = Array.from({ length: 50 }, (_, i) => ({
  value: `Apple-${i}`,
  label: "Apple",
}))

export const LargeList: Story = ({ variant, ...args }) => (
  <Select {...args}>
    <SelectTrigger variant={variant}>
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
)
