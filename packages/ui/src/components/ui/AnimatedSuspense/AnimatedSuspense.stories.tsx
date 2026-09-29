import type { Meta, StoryFn } from "@storybook/nextjs-vite"
import { startTransition, use, useState } from "react"
import { Card, CardContent } from "../Card/card"
import { Skeleton } from "../Skeleton/skeleton"
import { AnimatedSuspense } from "./AnimatedSuspense"

const meta: Meta<typeof AnimatedSuspense> = {
  title: "ui/AnimatedSuspense",
  component: AnimatedSuspense,
}

export default meta
type Story = StoryFn<typeof AnimatedSuspense>

const USERS = ["Jacob Turnbull", "Aleck Shen", "Andre Camerino", "Ashlee Shum"]

/** Mimics a 2s API call. */
const fetchUser = (count: number) =>
  new Promise<string>((resolve) => {
    setTimeout(() => resolve(USERS[count % USERS.length]), 2000)
  })

const UserCard = ({ promise }: { promise: Promise<string> }) => (
  <Card>
    <CardContent className="gap-1">
      <p className="font-medium">{use(promise)}</p>
      <p className="text-muted-foreground text-sm">University of Example</p>
    </CardContent>
  </Card>
)

const UserCardSkeleton = () => (
  <Card>
    <CardContent className="gap-2">
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-4 w-32" />
    </CardContent>
  </Card>
)

/**
 * The skeleton fades out and the card fades in. The animation needs a browser with the
 * View Transitions API; elsewhere the card swaps in with no animation.
 */
export const Default: Story = () => {
  const [count, setCount] = useState(0)
  const [promise, setPromise] = useState(() => fetchUser(0))

  // A new key remounts the boundary, so it suspends again and shows the fallback.
  const reload = () => {
    startTransition(() => {
      setCount(count + 1)
      setPromise(fetchUser(count + 1))
    })
  }

  return (
    <div className="w-72 space-y-4">
      <AnimatedSuspense fallback={<UserCardSkeleton />} key={count}>
        <UserCard promise={promise} />
      </AnimatedSuspense>
      <button className="rounded border px-3 py-1 text-sm" onClick={reload} type="button">
        Reload
      </button>
    </div>
  )
}

/** With no fallback, the boundary holds no space until the content is ready. */
export const WithoutFallback: Story = () => {
  // Held in state, so a re-render reads the same promise and does not suspend again.
  const [promise] = useState(() => fetchUser(1))

  return (
    <div className="w-72">
      <AnimatedSuspense>
        <UserCard promise={promise} />
      </AnimatedSuspense>
    </div>
  )
}
