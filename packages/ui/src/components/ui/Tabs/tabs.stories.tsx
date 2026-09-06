import type { Meta, StoryFn } from "@storybook/nextjs-vite"
import type { ComponentProps } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs"

type StoryArgs = ComponentProps<typeof Tabs> & {
  variant?: "pill" | "segmented" | "outline" | "ghost"
}

const meta: Meta<typeof Tabs> = {
  title: "ui/Tabs",
  component: Tabs,
  args: {
    // @ts-expect-error variant is a story-only control, forwarded to TabsList
    variant: "pill",
  },
  argTypes: {
    // @ts-expect-error variant is a story-only control, forwarded to TabsList
    variant: {
      control: { type: "select" },
      options: ["pill", "segmented", "outline", "ghost"],
    },
  },
}

export default meta
type Story = StoryFn<StoryArgs>

export const Default: Story = ({ variant, ...args }) => (
  <Tabs {...args} className="w-80" defaultValue="active">
    <TabsList className="w-full" variant={variant}>
      <TabsTrigger value="active">Active - 27</TabsTrigger>
      <TabsTrigger value="closed">Closed - 14</TabsTrigger>
    </TabsList>
    <TabsContent value="active">27 active items.</TabsContent>
    <TabsContent value="closed">14 closed items.</TabsContent>
  </Tabs>
)

export const Segmented: Story = ({ variant, ...args }) => (
  <Tabs {...args} className="w-80" defaultValue="active">
    <TabsList className="w-full" variant={variant}>
      <TabsTrigger value="active">Active</TabsTrigger>
      <TabsTrigger value="closed">Closed</TabsTrigger>
    </TabsList>
    <TabsContent value="active">Active items.</TabsContent>
    <TabsContent value="closed">Closed items.</TabsContent>
  </Tabs>
)
Segmented.args = { variant: "segmented" }

export const Outline: Story = ({ variant, ...args }) => (
  <Tabs {...args} className="w-80" defaultValue="active">
    <TabsList className="w-full" variant={variant}>
      <TabsTrigger value="active">Active</TabsTrigger>
      <TabsTrigger value="closed">Closed</TabsTrigger>
    </TabsList>
    <TabsContent value="active">Active items.</TabsContent>
    <TabsContent value="closed">Closed items.</TabsContent>
  </Tabs>
)
Outline.args = { variant: "outline" }

export const Ghost: Story = ({ variant, ...args }) => (
  <Tabs {...args} className="w-80" defaultValue="active">
    <TabsList className="w-full" variant={variant}>
      <TabsTrigger value="active">Active</TabsTrigger>
      <TabsTrigger value="closed">Closed</TabsTrigger>
    </TabsList>
    <TabsContent value="active">Active items.</TabsContent>
    <TabsContent value="closed">Closed items.</TabsContent>
  </Tabs>
)
Ghost.args = { variant: "ghost" }

export const ThreeTabs: Story = ({ variant, ...args }) => (
  <Tabs {...args} className="w-96" defaultValue="account">
    <TabsList className="w-full" variant={variant}>
      <TabsTrigger value="account">Account</TabsTrigger>
      <TabsTrigger value="password">Password</TabsTrigger>
      <TabsTrigger value="team">Team</TabsTrigger>
    </TabsList>
    <TabsContent value="account">Manage your account details.</TabsContent>
    <TabsContent value="password">Change your password here.</TabsContent>
    <TabsContent value="team">Invite and manage team members.</TabsContent>
  </Tabs>
)

export const IntrinsicWidth: Story = ({ variant, ...args }) => (
  <Tabs {...args} defaultValue="overview">
    <TabsList variant={variant}>
      <TabsTrigger value="overview">Overview</TabsTrigger>
      <TabsTrigger value="analytics">Analytics dashboard</TabsTrigger>
      <TabsTrigger value="settings">Settings</TabsTrigger>
    </TabsList>
    <TabsContent value="overview">Overview.</TabsContent>
    <TabsContent value="analytics">Analytics dashboard.</TabsContent>
    <TabsContent value="settings">Settings.</TabsContent>
  </Tabs>
)

export const DisabledTab: Story = ({ variant, ...args }) => (
  <Tabs {...args} className="w-96" defaultValue="account">
    <TabsList className="w-full" variant={variant}>
      <TabsTrigger value="account">Account</TabsTrigger>
      <TabsTrigger disabled value="password">
        Password
      </TabsTrigger>
      <TabsTrigger value="team">Team</TabsTrigger>
    </TabsList>
    <TabsContent value="account">Manage your account details.</TabsContent>
    <TabsContent value="password">Change your password here.</TabsContent>
    <TabsContent value="team">Invite and manage team members.</TabsContent>
  </Tabs>
)
