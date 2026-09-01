import { cn } from "@repo/ui/lib/utils"
import type { Meta, StoryFn } from "@storybook/nextjs-vite"
import { Suspense, use, useState } from "react"
import { Skeleton } from "./skeleton"

const meta: Meta<typeof Skeleton> = {
  title: "ui/Skeleton",
  component: Skeleton,
  args: {
    className: "",
  },
  argTypes: {
    className: {
      control: "text",
    },
  },
}

export default meta
type Story = StoryFn<typeof Skeleton>

export const Default: Story = ({ className }) => (
  <div className="flex items-center gap-4">
    <Skeleton className={cn("h-12 w-12 rounded-full", className)} />
    <div className="space-y-2">
      <Skeleton className={cn("h-4 w-[250px]", className)} />
      <Skeleton className={cn("h-4 w-[200px]", className)} />
    </div>
  </div>
)

const USERS = ["Jacob Turnbull", "Aleck Shen", "Andre Camerino", "Ashlee Shum"]

type Request = { count: number; promise: Promise<string>; done: boolean }

/** Mimics a 2s API call */
function fetchUser(count: number): Request {
  const request: Request = {
    count,
    done: false,
    promise: new Promise((resolve) => {
      setTimeout(() => {
        request.done = true
        resolve(USERS[count % USERS.length])
      }, 2000)
    }),
  }
  return request
}

export const InSuspense: Story = ({ className }) => {
  const [request, setRequest] = useState(() => fetchUser(0))

  return (
    <div className="w-64 space-y-4">
      <Suspense fallback={<Skeleton className={cn("h-5 w-40", className)} />}>
        <UserName promise={request.promise} />
      </Suspense>
      <button
        className="rounded border px-3 py-1 text-sm"
        onClick={() => {
          if (request.done) setRequest(fetchUser(request.count + 1))
        }}
        type="button"
      >
        Reload
      </button>
    </div>
  )
}

function UserName({ promise }: { promise: Promise<string> }) {
  return <p className="font-medium">{use(promise)}</p>
}
