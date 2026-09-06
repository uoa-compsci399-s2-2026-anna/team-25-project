import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { Sparkles } from "lucide-react"
import { Button } from "../Button/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardIcon,
  CardTitle,
} from "./card"

const meta: Meta<typeof Card> = {
  title: "ui/Card",
  component: Card,
  args: {
    size: "default",
  },
  argTypes: {
    size: {
      control: { type: "select" },
      options: ["default", "sm"],
    },
  },
}

export default meta
type Story = StoryObj<typeof Card>

export const Primary: Story = {
  render: (args) => (
    <Card {...args} className="w-80">
      <CardHeader>
        <CardIcon>
          <Sparkles />
        </CardIcon>
        <CardTitle>Member Directory</CardTitle>
        <CardDescription>Find and connect with members of your organization.</CardDescription>
      </CardHeader>
    </Card>
  ),
}

export const WithFooter: Story = {
  render: (args) => (
    <Card {...args} className="w-80">
      <CardHeader>
        <CardTitle>Create project</CardTitle>
        <CardDescription>Deploy your new project in one click.</CardDescription>
        <CardAction>
          <Button size="sm" variant="outline">
            Settings
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <p>Project details and configuration.</p>
      </CardContent>
      <CardFooter>
        <Button>Cancel</Button>
        <Button>Deploy</Button>
      </CardFooter>
    </Card>
  ),
}

export const FeatureCardsRow: Story = {
  render: () => (
    <div className="flex gap-4">
      {[
        {
          title: "Dr Anna Tui",
          description: "Senior Lecturer",
          details: "University of Auckland",
          tags: ["Assessment", "Multi-Institutional"],
        },
        {
          title: "Prof. James Ngata",
          description: "Associate Professor",
          details: "Victoria University of Wellington",
          tags: ["Curriculum", "Multi-Institutional"],
        },
        {
          title: "Dr Meera Patel",
          description: "Research Fellow",
          details: "University of Otago",
          tags: ["Assessment", "Research"],
        },
      ].map((feature) => (
        <Card className="w-[20vw]" key={feature.title}>
          <CardHeader>
            <CardIcon className="size-8">
              <Sparkles />
            </CardIcon>
            <CardTitle>{feature.title}</CardTitle>
            <div className="font-light text-sm">
              <CardDescription>{feature.description}</CardDescription>
              <CardDescription>{feature.details}</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="h-full w-full">
            <div className="flex justify-start gap-3">
              {feature.tags.map((tag) => (
                <span className="rounded-lg bg-brand-peach p-2 text-xs" key={tag}>
                  {tag}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  ),
}

export const StatsCard: Story = {
  render: () => (
    <Card className="h-[40vh] w-[50vw]">
      <CardHeader>
        <CardTitle className="font-normal text-lg">Log in to see proposals available</CardTitle>
        <CardDescription>
          Proposals are shared in confidence between CCCA members, so titles and details stay
          private until you sign in.
        </CardDescription>
      </CardHeader>
      <CardContent className="h-full">
        <div className="flex gap-3">
          <span className="flex w-[20%] flex-col text-xs">
            <span className="text-xl">27</span>
            Active proposals seeking collaborators
          </span>
          <span aria-hidden="true" className="w-px self-stretch bg-border" />
          <span className="flex w-[20%] flex-col text-xs">
            <span className="text-xl">6</span>
            Posted in the last 30 days
          </span>
          <span aria-hidden="true" className="w-px self-stretch bg-border" />
          <span className="flex w-[20%] flex-col text-xs">
            <span className="text-xl">8</span>
            Universities represented
          </span>
        </div>
      </CardContent>
      <CardFooter className="border-none bg-brand-cream">
        <Button>Log In</Button>
        <Button variant="outline">Register with your uni email</Button>
      </CardFooter>
    </Card>
  ),
}

export const FullWidthCallout: Story = {
  render: () => (
    <Card className="w-full bg-brand-mauve text-white">
      <CardHeader>
        <CardTitle className="font-bold text-2xl">Have a research idea?</CardTitle>
        <CardDescription>
          Post it as a proposal, keep it active while you’re recruiting, and close it once your team
          is formed
        </CardDescription>
      </CardHeader>
      <CardContent className="h-full">
        <Button className="text-black" variant="outline">
          Post a proposal
        </Button>
      </CardContent>
    </Card>
  ),
}
