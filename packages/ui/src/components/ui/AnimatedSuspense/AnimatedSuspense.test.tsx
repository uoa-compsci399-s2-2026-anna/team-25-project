import { act, cleanup, render, screen } from "@testing-library/react"
import { use } from "react"
import { afterEach, describe, expect, it } from "vitest"
import { AnimatedSuspense } from "./AnimatedSuspense"

const deferred = () => {
  let resolve!: (value: string) => void
  const promise = new Promise<string>((done) => {
    resolve = done
  })
  return { promise, resolve }
}

const Name = ({ promise }: { promise: Promise<string> }) => <p>{use(promise)}</p>

describe("AnimatedSuspense", () => {
  afterEach(() => {
    cleanup()
  })

  it("shows the fallback while the content is pending", async () => {
    const { promise } = deferred()

    await act(async () => {
      render(
        <AnimatedSuspense fallback={<p>Loading name</p>}>
          <Name promise={promise} />
        </AnimatedSuspense>,
      )
    })

    expect(screen.getByText("Loading name")).toBeInTheDocument()
  })

  it("swaps the fallback for the content once it resolves", async () => {
    const { promise, resolve } = deferred()

    await act(async () => {
      render(
        <AnimatedSuspense fallback={<p>Loading name</p>}>
          <Name promise={promise} />
        </AnimatedSuspense>,
      )
    })
    await act(async () => {
      resolve("Anna Tui")
      await promise
    })

    expect(screen.getByText("Anna Tui")).toBeInTheDocument()
    expect(screen.queryByText("Loading name")).not.toBeInTheDocument()
  })

  it("renders the content at once when nothing suspends", () => {
    render(
      <AnimatedSuspense fallback={<p>Loading name</p>}>
        <p>Anna Tui</p>
      </AnimatedSuspense>,
    )

    expect(screen.getByText("Anna Tui")).toBeInTheDocument()
    expect(screen.queryByText("Loading name")).not.toBeInTheDocument()
  })

  it("renders nothing while pending when there is no fallback", async () => {
    const { promise } = deferred()
    let container!: HTMLElement

    await act(async () => {
      ;({ container } = render(
        <AnimatedSuspense>
          <Name promise={promise} />
        </AnimatedSuspense>,
      ))
    })

    expect(container).toBeEmptyDOMElement()
  })
})
