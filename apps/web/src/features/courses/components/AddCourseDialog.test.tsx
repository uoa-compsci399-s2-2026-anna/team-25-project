import { toast } from "@repo/ui/components/ui"
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { useRouter } from "next/navigation"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { createCourse } from "../actions/createCourse"
import { AddCourseDialog } from "./AddCourseDialog"

vi.mock("../actions/createCourse", () => ({ createCourse: vi.fn() }))
vi.mock("next/navigation", () => ({ useRouter: vi.fn() }))

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((r) => {
    resolve = r
  })
  return { promise, resolve }
}

function openDialog(defaultRole: string | Promise<string> = "") {
  render(<AddCourseDialog defaultRole={Promise.resolve(defaultRole)} />)
  fireEvent.click(screen.getByRole("button", { name: "+ Add your course" }))
}

describe("AddCourseDialog", () => {
  const refresh = vi.fn()

  beforeEach(() => {
    // biome-ignore lint/suspicious/noExplicitAny: minimal useRouter mock, only .refresh is used
    vi.mocked(useRouter).mockReturnValue({ refresh } as any)
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
    act(() => {
      toast.close()
    })
  })

  it("opens the dialog from the trigger button", () => {
    openDialog()
    expect(screen.getByRole("dialog", { name: "Add a capstone course" })).toBeInTheDocument()
  })

  it("pre-fills Your role from the given default", async () => {
    openDialog("Senior Lecturer")
    await waitFor(() => {
      expect(screen.getByLabelText("Your role")).toHaveValue("Senior Lecturer")
    })
  })

  it("opens before the default role has arrived, and keeps what was typed when it does", async () => {
    const role = deferred<string>()
    openDialog(role.promise)

    expect(screen.getByRole("dialog", { name: "Add a capstone course" })).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText("Course code"), { target: { value: "CS399" } })
    fireEvent.change(screen.getByLabelText("Your role"), { target: { value: "Tutor" } })

    await act(async () => {
      role.resolve("Senior Lecturer")
    })

    expect(screen.getByLabelText("Course code")).toHaveValue("CS399")
    expect(screen.getByLabelText("Your role")).toHaveValue("Tutor")
  })

  it("fills a still-blank Your role when the default arrives after opening", async () => {
    const role = deferred<string>()
    openDialog(role.promise)

    fireEvent.change(screen.getByLabelText("Course code"), { target: { value: "CS399" } })

    await act(async () => {
      role.resolve("Senior Lecturer")
    })

    expect(screen.getByLabelText("Course code")).toHaveValue("CS399")
    expect(screen.getByLabelText("Your role")).toHaveValue("Senior Lecturer")
  })

  it("resets Your role back to the default, not blank, on reopen", async () => {
    vi.mocked(createCourse).mockResolvedValue({ ok: true })
    openDialog("Senior Lecturer")

    fireEvent.change(screen.getByLabelText("Your role"), { target: { value: "Editing this" } })
    fireEvent.change(screen.getByLabelText("Course code"), { target: { value: "CS399" } })
    fireEvent.click(screen.getByRole("button", { name: "Save draft" }))

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole("button", { name: "+ Add your course" }))
    await waitFor(() => {
      expect(screen.getByLabelText("Your role")).toHaveValue("Senior Lecturer")
    })
  })

  it("submits the current field values to createCourse", async () => {
    vi.mocked(createCourse).mockResolvedValue({ ok: true })
    openDialog()

    fireEvent.change(screen.getByLabelText("Course code"), { target: { value: "CS399" } })
    fireEvent.change(screen.getByLabelText("Teaching period"), {
      target: { value: "Semester 2, 2026" },
    })
    fireEvent.change(screen.getByLabelText("Start date"), { target: { value: "2026-07-13" } })
    fireEvent.change(screen.getByLabelText("End date"), { target: { value: "2026-11-06" } })
    fireEvent.click(screen.getByRole("button", { name: "Save draft" }))

    await waitFor(() => {
      expect(createCourse).toHaveBeenCalledWith(
        expect.objectContaining({
          code: "CS399",
          endDate: "2026-11-06",
          intent: "draft",
          period: "Semester 2, 2026",
          startDate: "2026-07-13",
        }),
      )
    })
  })

  it("submits with a publish intent when Publish is clicked", async () => {
    vi.mocked(createCourse).mockResolvedValue({ ok: true })
    openDialog()

    fireEvent.change(screen.getByLabelText("Course code"), { target: { value: "CS399" } })
    fireEvent.change(screen.getByLabelText("Your role"), {
      target: { value: "Course Coordinator" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Publish" }))

    await waitFor(() => {
      expect(createCourse).toHaveBeenCalledWith(
        expect.objectContaining({ intent: "publish", role: "Course Coordinator" }),
      )
    })
  })

  it("shows a publish-only field error against the field it names", async () => {
    vi.mocked(createCourse).mockResolvedValue({
      fieldErrors: { role: "Your role is required to publish" },
      ok: false,
    })
    openDialog()

    fireEvent.click(screen.getByRole("button", { name: "Publish" }))

    expect(await screen.findByText("Your role is required to publish")).toBeInTheDocument()
    expect(screen.getByRole("dialog")).toBeInTheDocument()
  })

  it("closes the dialog, resets the form, and refreshes the route on success", async () => {
    vi.mocked(createCourse).mockResolvedValue({ ok: true })
    openDialog()

    fireEvent.change(screen.getByLabelText("Course code"), { target: { value: "CS399" } })
    fireEvent.click(screen.getByRole("button", { name: "Save draft" }))

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    })
    expect(refresh).toHaveBeenCalled()

    fireEvent.click(screen.getByRole("button", { name: "+ Add your course" }))
    expect(screen.getByLabelText("Course code")).toHaveValue("")
  })

  it("shows a field error against the offending input and keeps the dialog open", async () => {
    vi.mocked(createCourse).mockResolvedValue({
      fieldErrors: { code: "Course code is required" },
      ok: false,
    })
    openDialog()

    fireEvent.click(screen.getByRole("button", { name: "Save draft" }))

    expect(await screen.findByText("Course code is required")).toBeInTheDocument()
    expect(screen.getByRole("dialog")).toBeInTheDocument()
    expect(refresh).not.toHaveBeenCalled()
  })

  it("shows a form-level error when createCourse rejects", async () => {
    vi.mocked(createCourse).mockRejectedValue(new Error("network error"))
    openDialog()

    fireEvent.click(screen.getByRole("button", { name: "Save draft" }))

    expect(await screen.findByText("Could not add this course. Try again.")).toBeInTheDocument()
  })
})
