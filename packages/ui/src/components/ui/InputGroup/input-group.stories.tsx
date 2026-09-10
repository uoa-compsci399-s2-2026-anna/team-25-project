import type { Meta, StoryFn } from "@storybook/nextjs-vite"
import { SearchIcon, XIcon } from "lucide-react"
import { useState } from "react"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from "./input-group"

const variants = ["field", "pill"] as const

const meta: Meta<typeof InputGroup> = {
  title: "ui/InputGroup",
  component: InputGroup,
  args: {
    variant: "field",
  },
  argTypes: {
    variant: {
      control: { type: "select" },
      options: variants,
    },
  },
}

export default meta
type Story = StoryFn<typeof InputGroup>

export const Default: Story = (args) => (
  <InputGroup {...args}>
    <InputGroupInput placeholder="Search..." />
    <InputGroupAddon>
      <SearchIcon />
    </InputGroupAddon>
  </InputGroup>
)

export const Pill: Story = (args) => (
  <InputGroup {...args} className="w-fit">
    <InputGroupInput placeholder="University" />
    <InputGroupAddon align="inline-end">
      <SearchIcon />
    </InputGroupAddon>
  </InputGroup>
)
Pill.args = { variant: "pill" }

export const WithButton: Story = (args) => {
  const [value, setValue] = useState("Clear me")

  return (
    <InputGroup {...args}>
      <InputGroupInput onChange={(e) => setValue(e.target.value)} value={value} />
      <InputGroupAddon align="inline-end">
        {value !== "" && (
          <InputGroupButton aria-label="Clear" onClick={() => setValue("")} size="icon-xs">
            <XIcon />
          </InputGroupButton>
        )}
      </InputGroupAddon>
    </InputGroup>
  )
}

export const WithText: Story = (args) => (
  <InputGroup {...args}>
    <InputGroupAddon>
      <InputGroupText>https://</InputGroupText>
    </InputGroupAddon>
    <InputGroupInput placeholder="example.com" />
  </InputGroup>
)

export const WithTextarea: Story = (args) => (
  <InputGroup {...args}>
    <InputGroupTextarea placeholder="Write a note..." />
    <InputGroupAddon align="block-end">
      <InputGroupButton>Send</InputGroupButton>
    </InputGroupAddon>
  </InputGroup>
)

export const Disabled: Story = (args) => (
  <InputGroup {...args}>
    <InputGroupInput disabled placeholder="Search..." />
    <InputGroupAddon>
      <SearchIcon />
    </InputGroupAddon>
  </InputGroup>
)
