import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { ReactNode } from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { AVATAR_KEY, PROFILE_KEY } from "../../actions/profileFormData"
import { updateMemberProfile } from "../../actions/updateMemberProfile"
import { EditButton } from "./EditButton"
import { EditProvider } from "./EditContext"
import { EditSwitch } from "./EditField"
import { EditInput } from "./EditInput"
import { EditSelect } from "./EditSelect"
import { EditTagList } from "./EditTagList"
import { EditUploadAvatar } from "./EditUploadAvatar"

vi.mock("../../actions/updateMemberProfile", () => ({ updateMemberProfile: vi.fn() }))

const renderEditable = (ui: ReactNode) =>
  render(
    <EditProvider>
      {ui}
      <EditButton />
    </EditProvider>,
  )

/** The FormData the form last sent to updateMemberProfile. */
const submittedFormData = () => {
  const formData = vi.mocked(updateMemberProfile).mock.lastCall?.[0]
  if (!formData) throw new Error("updateMemberProfile wasn't called")
  return formData
}

const submittedProfile = () => JSON.parse(String(submittedFormData().get(PROFILE_KEY)))

const startEditing = async (user: ReturnType<typeof userEvent.setup>) =>
  user.click(screen.getByRole("button", { name: "Edit" }))

describe("Edit components", () => {
  beforeEach(() => {
    vi.mocked(updateMemberProfile).mockReset().mockResolvedValue({ ok: true })
  })

  afterEach(() => {
    cleanup()
  })

  describe("EditButton", () => {
    it("shows Done and Cancel while editing, and Edit again after cancelling", async () => {
      const user = userEvent.setup()
      renderEditable(null)

      await startEditing(user)
      expect(screen.getByRole("button", { name: "Done" })).toBeInTheDocument()

      await user.click(screen.getByRole("button", { name: "Cancel" }))
      expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument()
    })

    it("keeps editing and shows the error when saving fails", async () => {
      vi.mocked(updateMemberProfile).mockResolvedValue({ formError: "Nope.", ok: false })
      const user = userEvent.setup()
      renderEditable(null)

      await startEditing(user)
      await user.click(screen.getByRole("button", { name: "Done" }))

      expect(await screen.findByText("Nope.")).toBeInTheDocument()
      expect(screen.getByRole("button", { name: "Done" })).toBeInTheDocument()
    })
  })

  describe("EditSwitch", () => {
    it("swaps one view for several fields", async () => {
      const user = userEvent.setup()
      renderEditable(
        <EditSwitch view={<h1>Anna Tui</h1>}>
          <EditInput label="First name" name="firstName" value="Anna" />
          <EditInput label="Last name" name="lastName" value="Tui" />
        </EditSwitch>,
      )

      expect(screen.getByRole("heading", { name: "Anna Tui" })).toBeInTheDocument()
      await startEditing(user)

      expect(screen.queryByRole("heading")).not.toBeInTheDocument()
      expect(screen.getAllByRole("textbox")).toHaveLength(2)
    })
  })

  describe("EditInput", () => {
    it("shows the view until editing, then an input seeded with the saved value", async () => {
      const user = userEvent.setup()
      renderEditable(
        <EditInput label="Position" name="position" value="Lecturer" view={<p>Lecturer</p>} />,
      )

      expect(screen.getByText("Lecturer")).toBeInTheDocument()
      expect(screen.queryByRole("textbox")).not.toBeInTheDocument()

      await startEditing(user)
      expect(screen.getByRole("textbox", { name: "Position" })).toHaveValue("Lecturer")
    })

    it("throws away a cancelled draft", async () => {
      const user = userEvent.setup()
      renderEditable(<EditInput label="Position" name="position" value="Lecturer" />)

      await startEditing(user)
      await user.clear(screen.getByRole("textbox", { name: "Position" }))
      await user.type(screen.getByRole("textbox", { name: "Position" }), "Draft")
      await user.click(screen.getByRole("button", { name: "Cancel" }))
      await startEditing(user)

      expect(screen.getByRole("textbox", { name: "Position" })).toHaveValue("Lecturer")
    })

    it("treats a missing value as empty and renders a text area when multiline", async () => {
      const user = userEvent.setup()
      renderEditable(<EditInput label="Bio" multiline name="bio" value={null} />)

      await startEditing(user)
      const bio = screen.getByRole("textbox", { name: "Bio" })
      expect(bio.tagName).toBe("TEXTAREA")
      expect(bio).toHaveValue("")
    })

    it("shows the shared schema's error on the field and won't save", async () => {
      const user = userEvent.setup()
      renderEditable(<EditInput label="Position" name="position" value="Lecturer" />)

      await startEditing(user)
      await user.clear(screen.getByRole("textbox", { name: "Position" }))
      await user.click(screen.getByRole("button", { name: "Done" }))

      expect(await screen.findByRole("alert")).toHaveTextContent("Position is required")
      expect(screen.getByRole("textbox", { name: "Position" })).toHaveAttribute(
        "aria-invalid",
        "true",
      )
      expect(updateMemberProfile).not.toHaveBeenCalled()
    })

    it("submits the edited value", async () => {
      const user = userEvent.setup()
      renderEditable(<EditInput label="Position" name="position" value="Lecturer" />)

      await startEditing(user)
      await user.type(screen.getByRole("textbox", { name: "Position" }), " II")
      await user.click(screen.getByRole("button", { name: "Done" }))

      expect(await screen.findByRole("button", { name: "Edit" })).toBeInTheDocument()
      expect(submittedProfile()).toEqual({ position: "Lecturer II" })
    })
  })

  describe("EditSelect", () => {
    it("shows the saved option's label in a labelled select", async () => {
      const user = userEvent.setup()
      renderEditable(
        <EditSelect
          label="Title"
          name="title"
          nullLabel="None"
          options={[
            { label: "Dr", value: "dr" },
            { label: "Prof", value: "prof" },
          ]}
          value="dr"
        />,
      )

      await startEditing(user)
      expect(screen.getByRole("combobox", { name: "Title" })).toHaveTextContent("Dr")
    })

    it("shows the null label when there's no saved value", async () => {
      const user = userEvent.setup()
      renderEditable(
        <EditSelect
          label="Title"
          name="title"
          nullLabel="None"
          options={[{ label: "Dr", value: "dr" }]}
          value={null}
        />,
      )

      await startEditing(user)
      expect(screen.getByRole("combobox", { name: "Title" })).toHaveTextContent("None")
    })
  })

  describe("EditTagList", () => {
    const renderTags = (value: string[]) =>
      renderEditable(
        <EditTagList
          itemLabel="interest"
          label="Interests"
          max={3}
          name="researchInterests"
          value={value}
        />,
      )

    it("adds, edits and removes tags", async () => {
      const user = userEvent.setup()
      renderTags(["AI"])

      await startEditing(user)
      await user.click(screen.getByRole("button", { name: "Add interest" }))
      await user.type(screen.getByRole("textbox", { name: "interest 2" }), "HCI")
      expect(screen.getByRole("textbox", { name: "interest 2" })).toHaveValue("HCI")

      await user.click(screen.getByRole("button", { name: "Remove AI" }))
      expect(screen.getAllByRole("textbox")).toHaveLength(1)
      expect(screen.getByRole("textbox", { name: "interest 1" })).toHaveValue("HCI")
    })

    it("stops adding once the list is full", async () => {
      const user = userEvent.setup()
      renderTags(["AI", "HCI", "Ethics"])

      await startEditing(user)
      expect(screen.getByRole("button", { name: "Add interest" })).toBeDisabled()
    })
  })

  describe("EditUploadAvatar", () => {
    const renderAvatar = () => {
      const result = renderEditable(
        <EditUploadAvatar fallback="AT" maxBytes={10} name="avatar" view={<span>Photo</span>} />,
      )
      return result
    }

    const pickFile = async (container: HTMLElement, file: File) => {
      const input = container.querySelector<HTMLInputElement>('input[type="file"]')
      if (!input) throw new Error("file input not found")
      await userEvent.setup({ applyAccept: false }).upload(input, file)
    }

    it("shows the view until editing, then the upload button", async () => {
      const user = userEvent.setup()
      renderAvatar()

      expect(screen.getByText("Photo")).toBeInTheDocument()
      await startEditing(user)
      expect(screen.getByRole("button", { name: "Upload photo" })).toBeInTheDocument()
    })

    it("rejects a photo over the size limit", async () => {
      const user = userEvent.setup()
      const { container } = renderAvatar()

      await startEditing(user)
      await pickFile(container, new File(["x".repeat(11)], "big.png", { type: "image/png" }))

      expect(screen.getByRole("alert")).toHaveTextContent("or smaller")
    })

    it("rejects a file type that isn't allowed", async () => {
      const user = userEvent.setup()
      const { container } = renderAvatar()

      await startEditing(user)
      await pickFile(container, new File(["<svg/>"], "logo.svg", { type: "image/svg+xml" }))

      expect(screen.getByRole("alert")).toHaveTextContent("JPG, PNG, GIF or WEBP")
    })

    it("sends the picked photo with the rest of the form on Done", async () => {
      const user = userEvent.setup()
      const { container } = renderAvatar()
      const photo = new File(["ok"], "me.png", { type: "image/png" })

      await startEditing(user)
      await pickFile(container, photo)
      await user.click(screen.getByRole("button", { name: "Done" }))

      expect(await screen.findByRole("button", { name: "Edit" })).toBeInTheDocument()
      expect(submittedFormData().get(AVATAR_KEY)).toEqual(photo)
    })
  })
})
