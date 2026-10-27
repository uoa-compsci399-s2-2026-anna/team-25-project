import { cleanup, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"
import { MemberPicker, type MemberPickerProps, type MemberSearch } from "./member-picker"
import { sampleMembers } from "./member-picker.fixtures"

const [ada, alan] = sampleMembers

const renderPicker = (overrides: Partial<MemberPickerProps> = {}) =>
  render(
    <MemberPicker
      label="Add a member"
      onSearch={vi.fn<MemberSearch>().mockResolvedValue([ada, alan])}
      onSelect={vi.fn()}
      {...overrides}
    />,
  )

const input = () => screen.getByRole("combobox", { name: "Add a member" })

describe("MemberPicker", () => {
  afterEach(() => {
    cleanup()
  })

  it("waits for two characters before it searches", async () => {
    const user = userEvent.setup()
    const onSearch = vi.fn<MemberSearch>().mockResolvedValue([ada])
    renderPicker({ onSearch })

    await user.type(input(), "a")
    await new Promise((resolve) => setTimeout(resolve, 400))
    expect(onSearch).not.toHaveBeenCalled()

    await user.type(input(), "d")
    await waitFor(() => expect(onSearch).toHaveBeenCalledWith("ad", []))
  })

  it("searches once for text typed quickly", async () => {
    const user = userEvent.setup()
    const onSearch = vi.fn<MemberSearch>().mockResolvedValue([ada])
    renderPicker({ onSearch })

    await user.type(input(), "ada")
    await screen.findByRole("option", { name: /Ada Lovelace/ })
    expect(onSearch).toHaveBeenCalledTimes(1)
  })

  it("leaves out excluded members", async () => {
    const user = userEvent.setup()
    renderPicker({ exclude: [ada.id] })

    await user.type(input(), "al")
    expect(await screen.findByRole("option", { name: /Alan Turing/ })).toBeInTheDocument()
    expect(screen.queryByRole("option", { name: /Ada Lovelace/ })).not.toBeInTheDocument()
  })

  it("asks the search to leave out excluded members", async () => {
    const user = userEvent.setup()
    const onSearch = vi.fn<MemberSearch>().mockResolvedValue([alan])
    const exclude = [ada.id]
    renderPicker({ exclude, onSearch })

    await user.type(input(), "al")
    await waitFor(() => expect(onSearch).toHaveBeenCalledWith("al", exclude))
  })

  it("ignores a slow reply for older text", async () => {
    const user = userEvent.setup()
    let answerOld: (members: typeof sampleMembers) => void = () => undefined
    const onSearch = vi.fn<MemberSearch>((query) =>
      query === "ad"
        ? new Promise((resolve) => {
            answerOld = resolve
          })
        : Promise.resolve([alan]),
    )
    renderPicker({ onSearch })

    await user.type(input(), "ad")
    await waitFor(() => expect(onSearch).toHaveBeenCalledWith("ad", []))
    await user.clear(input())
    await user.type(input(), "alan")
    await screen.findByRole("option", { name: /Alan Turing/ })

    answerOld([ada])
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(screen.queryByRole("option", { name: /Ada Lovelace/ })).not.toBeInTheDocument()
  })

  it("says why the search could not run", async () => {
    const user = userEvent.setup()
    renderPicker({
      onSearch: vi
        .fn<MemberSearch>()
        .mockResolvedValue({ error: "Sign in again to search members." }),
    })

    await user.type(input(), "ad")
    expect(await screen.findByText("Sign in again to search members.")).toBeInTheDocument()
  })

  it("logs a failed search and says it failed", async () => {
    const user = userEvent.setup()
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})
    const failure = new Error("network")
    renderPicker({ onSearch: vi.fn<MemberSearch>().mockRejectedValue(failure) })

    await user.type(input(), "ad")
    expect(await screen.findByText("Could not search members. Try again.")).toBeInTheDocument()
    expect(consoleError).toHaveBeenCalledWith("Could not search members", failure)
    consoleError.mockRestore()
  })

  it("passes on the chosen member and clears the text", async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    renderPicker({ onSelect })

    await user.type(input(), "ad")
    await user.click(await screen.findByRole("option", { name: /Ada Lovelace/ }))

    expect(onSelect).toHaveBeenCalledWith(ada)
    expect(input()).toHaveValue("")
  })
})
