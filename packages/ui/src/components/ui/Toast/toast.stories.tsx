import type { Meta, StoryFn } from "@storybook/nextjs-vite"
import { Button } from "../Button/button"
import { Toaster, toast } from "./toast"

const meta: Meta<typeof Toaster> = {
  title: "ui/Toast",
  component: Toaster,
}

export default meta
type Story = StoryFn<typeof Toaster>

const types = ["success", "info", "warning", "error", "loading"] as const

export const Default: Story = () => (
  <Toaster>
    <Button
      onClick={() =>
        toast.add({
          title: "Changes saved",
          description: "Your document is up to date.",
        })
      }
    >
      Show toast
    </Button>
  </Toaster>
)

export const Types: Story = () => (
  <Toaster>
    <div className="flex flex-wrap gap-2">
      {types.map((type) => (
        <Button
          key={type}
          onClick={() =>
            toast.add({
              type,
              title: `${type[0].toUpperCase()}${type.slice(1)} toast`,
              description: `This is a ${type} message.`,
              timeout: type === "loading" ? 0 : undefined,
            })
          }
          variant="outline"
        >
          {type}
        </Button>
      ))}
    </div>
  </Toaster>
)

export const WithAction: Story = () => (
  <Toaster>
    <Button
      onClick={() =>
        toast.add({
          title: "Message archived",
          description: "You can still find it in the archive.",
          actionProps: {
            children: "Undo",
            onClick: () => toast.add({ type: "success", title: "Restored" }),
          },
        })
      }
    >
      Show toast with action
    </Button>
  </Toaster>
)

export const PromiseToast: Story = () => (
  <Toaster>
    <Button
      onClick={() => {
        const task = new Promise((resolve) => setTimeout(resolve, 2000))
        toast.promise(task, {
          loading: "Uploading…",
          success: "Upload complete",
          error: "Upload failed",
        })
      }}
    >
      Run promise toast
    </Button>
  </Toaster>
)
