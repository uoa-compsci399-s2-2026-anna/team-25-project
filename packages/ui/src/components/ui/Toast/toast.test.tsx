import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import {
  createToastManager,
  Toast,
  ToastClose,
  ToastContent,
  Toaster,
  ToastPortal,
  ToastProvider,
  ToastViewport,
  toast,
  useToastManager,
} from "./toast"

function renderToaster() {
  const manager = createToastManager()
  render(<Toaster toastManager={manager} />)
  return manager
}

describe("Toaster", () => {
  afterEach(() => {
    cleanup()
  })

  it("renders the portal and viewport", () => {
    renderToaster()
    expect(document.querySelector("[data-slot=toast-viewport]")).toBeInTheDocument()
  })

  it("renders a toast title and description added through the manager", async () => {
    const manager = renderToaster()
    act(() => {
      manager.add({ title: "Saved", description: "All changes stored." })
    })
    expect(await screen.findByText("Saved")).toBeInTheDocument()
    expect(screen.getByText("All changes stored.")).toBeInTheDocument()
  })

  it.each(["success", "info", "warning", "error", "loading"])(
    "renders an icon for a %s toast",
    async (type) => {
      const manager = renderToaster()
      act(() => {
        manager.add({ type, title: `${type} done` })
      })
      await screen.findByText(`${type} done`)
      const icon = document.querySelector("[data-slot=toast-icon]")
      expect(icon).toBeInTheDocument()
      expect(icon?.querySelector("svg")).toBeInTheDocument()
    },
  )

  it("renders no icon for an unrecognised type", async () => {
    const manager = renderToaster()
    act(() => {
      manager.add({ type: "custom", title: "Unknown" })
    })
    await screen.findByText("Unknown")
    expect(document.querySelector("[data-slot=toast-icon]")).not.toBeInTheDocument()
  })

  it("uses the shared toast manager when none is passed", async () => {
    render(<Toaster />)
    act(() => {
      toast.add({ title: "Shared manager" })
    })
    expect(await screen.findByText("Shared manager")).toBeInTheDocument()
    act(() => {
      toast.close()
    })
  })

  it("does not render an icon when the toast has no type", async () => {
    const manager = renderToaster()
    act(() => {
      manager.add({ title: "Plain" })
    })
    await screen.findByText("Plain")
    expect(document.querySelector("[data-slot=toast-icon]")).not.toBeInTheDocument()
  })

  it("renders an action button and forwards its click handler", async () => {
    const manager = renderToaster()
    const onAction = vi.fn()
    act(() => {
      manager.add({
        title: "Archived",
        actionProps: { children: "Undo", onClick: onAction },
      })
    })
    const action = await screen.findByRole("button", { name: "Undo" })
    fireEvent.click(action)
    expect(onAction).toHaveBeenCalledTimes(1)
  })

  it("omits the action button when no actionProps are given", async () => {
    const manager = renderToaster()
    act(() => {
      manager.add({ title: "No action" })
    })
    await screen.findByText("No action")
    expect(screen.queryByRole("button", { name: "Undo" })).not.toBeInTheDocument()
  })

  it("dismisses a toast when its close button is clicked", async () => {
    const manager = renderToaster()
    act(() => {
      manager.add({ title: "Closable" })
    })
    await screen.findByText("Closable")
    const close = document.querySelector<HTMLButtonElement>("[data-slot=toast-close]")
    expect(close).not.toBeNull()
    expect(close).toHaveAttribute("aria-label", "Close toast")
    fireEvent.click(close as HTMLButtonElement)
    await waitFor(() => {
      expect(screen.queryByText("Closable")).not.toBeInTheDocument()
    })
  })

  it("renders multiple toasts at once", async () => {
    const manager = renderToaster()
    act(() => {
      manager.add({ title: "First" })
      manager.add({ title: "Second" })
    })
    expect(await screen.findByText("First")).toBeInTheDocument()
    expect(screen.getByText("Second")).toBeInTheDocument()
  })

  it("auto-dismisses a toast after its timeout elapses", async () => {
    const manager = renderToaster()
    act(() => {
      manager.add({ title: "Temporary", timeout: 100 })
    })
    expect(await screen.findByText("Temporary")).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.queryByText("Temporary")).not.toBeInTheDocument()
    })
  })

  it("keeps a toast with timeout 0 until it is closed manually", async () => {
    const manager = renderToaster()
    act(() => {
      manager.add({ title: "Sticky", timeout: 0 })
    })
    await screen.findByText("Sticky")
    await new Promise((resolve) => setTimeout(resolve, 150))
    expect(screen.getByText("Sticky")).toBeInTheDocument()
  })
})

describe("Toast parts", () => {
  afterEach(() => {
    cleanup()
  })

  function CustomList() {
    const manager = useToastManager()
    return manager.toasts.map((item) => (
      <Toast className="custom-toast" key={item.id} toast={item}>
        <ToastContent>
          <ToastClose>Dismiss</ToastClose>
        </ToastContent>
      </Toast>
    ))
  }

  function renderParts() {
    const manager = createToastManager()
    render(
      <ToastProvider toastManager={manager}>
        <ToastPortal>
          <ToastViewport>
            <CustomList />
          </ToastViewport>
        </ToastPortal>
      </ToastProvider>,
    )
    return manager
  }

  it("merges a custom className onto the toast root", async () => {
    const manager = renderParts()
    act(() => {
      manager.add({ title: "Styled" })
    })
    await waitFor(() => {
      expect(document.querySelector("[data-slot=toast]")).toHaveClass("custom-toast")
    })
  })

  it("renders custom close button children instead of the default icon", async () => {
    const manager = renderParts()
    act(() => {
      manager.add({ title: "With custom close" })
    })
    const close = await screen.findByText("Dismiss")
    expect(close.closest("[data-slot=toast-close]")).toBeInTheDocument()
    expect(close.querySelector("svg")).not.toBeInTheDocument()
  })
})
