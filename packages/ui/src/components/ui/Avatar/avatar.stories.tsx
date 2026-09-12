import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from "./avatar"

const meta: Meta<typeof Avatar> = {
  title: "ui/Avatar",
  component: Avatar,
  args: {
    size: "default",
  },
  argTypes: {
    size: {
      control: { type: "select" },
      options: ["sm", "default", "lg", "xl"],
    },
  },
}

export default meta
type Story = StoryObj<typeof Avatar>

export const Primary: Story = {
  args: {
    size: "default",
    // @ts-expect-error imageSrc is a story-only control, not a real Avatar prop
    imageSrc: "https://github.com/shadcn.png",
  },
  argTypes: {
    // @ts-expect-error imageSrc is a story-only control, not a real Avatar prop
    imageSrc: {
      control: { accept: "image/*", type: "file" },
    },
  },
  render: (args) => (
    <Avatar size={args.size}>
      <AvatarImage alt="User" src={(args as { imageSrc?: string }).imageSrc} />
      <AvatarFallback>JD</AvatarFallback>
    </Avatar>
  ),
}

export const Fallback: Story = {
  render: () => (
    <Avatar>
      <AvatarImage alt="User" src="/broken-image.png" />
      <AvatarFallback>JD</AvatarFallback>
    </Avatar>
  ),
}

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      {(["sm", "default", "lg"] as const).map((size) => (
        <Avatar key={size} size={size}>
          <AvatarImage alt="User" src="https://github.com/shadcn.png" />
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      ))}
    </div>
  ),
}

export const WithBadge: Story = {
  render: () => (
    <Avatar>
      <AvatarImage alt="User" src="https://github.com/shadcn.png" />
      <AvatarFallback>JD</AvatarFallback>
      <AvatarBadge />
    </Avatar>
  ),
}

export const Group: Story = {
  render: () => (
    <AvatarGroup>
      <Avatar>
        <AvatarImage alt="User" src="https://github.com/shadcn.png" />
        <AvatarFallback>JD</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback>AS</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback>MK</AvatarFallback>
      </Avatar>
      <AvatarGroupCount>+3</AvatarGroupCount>
    </AvatarGroup>
  ),
}
