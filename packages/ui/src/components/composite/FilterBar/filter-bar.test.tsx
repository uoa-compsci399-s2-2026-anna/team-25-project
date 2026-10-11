import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"
import { FilterBar, type FilterBarFilter, type FilterBarProps, FilterBarSkeleton } from "../index"

const universityFilter = (value: string | null = null): FilterBarFilter => ({
  id: "institution",
  onValueChange: vi.fn(),
  options: [{ label: "University of Example", value: "1" }],
  placeholder: "University",
  value,
})

const tagsFilter = (value: string[] = [], maxSelected?: number): FilterBarFilter => ({
  id: "tags",
  maxSelected,
  multiple: true,
  onValueChange: vi.fn(),
  options: [
    { label: "Assessment", value: "assessment" },
    { label: "Teamwork", value: "teamwork" },
  ],
  placeholder: "Tags",
  value,
})

const props = (): FilterBarProps => ({
  filters: [universityFilter()],
  onSearchChange: vi.fn(),
  onSortChange: vi.fn(),
  onStatusChange: vi.fn(),
  search: "",
  searchPlaceholder: "Search proposals...",
  sort: "newest",
  sortOptions: [
    { label: "Newest first", value: "newest" },
    { label: "Oldest first", value: "oldest" },
  ],
  status: "active",
  statusOptions: [
    { count: 27, label: "Active", value: "active" },
    { count: 14, label: "Closed", value: "closed" },
    { label: "All", value: "all" },
  ],
})

describe("FilterBar", () => {
  afterEach(() => {
    cleanup()
  })

  it("renders status tabs with their counts", () => {
    render(<FilterBar {...props()} />)

    expect(screen.getByRole("tab", { name: "Active - 27" })).toHaveAttribute(
      "aria-selected",
      "true",
    )
    expect(screen.getByRole("tab", { name: "Closed - 14" })).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: "All" })).toBeInTheDocument()
  })

  it("reports a status change", async () => {
    const p = props()
    render(<FilterBar {...p} />)

    await userEvent.click(screen.getByRole("tab", { name: "Closed - 14" }))
    expect(p.onStatusChange).toHaveBeenCalledWith("closed")
  })

  it("reports search input", async () => {
    const p = props()
    render(<FilterBar {...p} />)

    await userEvent.type(screen.getByRole("searchbox", { name: "Search proposals..." }), "a")
    expect(p.onSearchChange).toHaveBeenCalledWith("a")
  })

  it("shows the placeholder for an unset filter and the label of the current sort", () => {
    render(<FilterBar {...props()} />)

    expect(screen.getByRole("combobox", { name: "University" })).toHaveTextContent("University")
    expect(screen.getByRole("combobox", { name: "Sort" })).toHaveTextContent("Newest first")
  })

  it("shows the label of a picked filter", () => {
    const p = props()
    render(<FilterBar {...p} filters={[universityFilter("1")]} />)

    expect(screen.getByRole("combobox", { name: "University" })).toHaveTextContent(
      "University of Example",
    )
  })

  it("reports a filter selection and clear", async () => {
    const user = userEvent.setup()
    const p = props()
    const filter = p.filters?.[0]
    render(<FilterBar {...p} />)

    await user.click(screen.getByRole("combobox", { name: "University" }))
    await screen.findByRole("listbox")
    await user.click(screen.getByRole("option", { name: "University of Example" }))
    expect(filter?.onValueChange).toHaveBeenLastCalledWith("1")

    await user.click(screen.getByRole("combobox", { name: "University" }))
    await screen.findByRole("listbox")
    await user.click(screen.getByRole("option", { name: "Any university" }))
    expect(filter?.onValueChange).toHaveBeenLastCalledWith(null)
  })

  // The chips beside the bar name what is picked, so the trigger does not restate it.
  it("keeps a multiple filter on its placeholder whatever is picked", () => {
    render(<FilterBar {...props()} filters={[tagsFilter(["assessment", "teamwork"])]} />)

    expect(screen.getByRole("combobox", { name: "Tags" })).toHaveTextContent("Tags")
    expect(screen.getByRole("combobox", { name: "Tags" })).not.toHaveTextContent("Assessment")
  })

  it("leaves unpicked options selectable below the cap", async () => {
    const user = userEvent.setup()
    render(<FilterBar {...props()} filters={[tagsFilter(["assessment"], 2)]} />)

    await user.click(screen.getByRole("combobox", { name: "Tags" }))
    await screen.findByRole("listbox")
    expect(screen.getByRole("option", { name: "Teamwork" })).not.toHaveAttribute("data-disabled")
  })

  it("disables the rest at the cap, but not what is already picked", async () => {
    const user = userEvent.setup()
    render(<FilterBar {...props()} filters={[tagsFilter(["assessment"], 1)]} />)

    await user.click(screen.getByRole("combobox", { name: "Tags" }))
    await screen.findByRole("listbox")

    // The picked one stays live so it can still be unpicked.
    expect(screen.getByRole("option", { name: "Assessment" })).not.toHaveAttribute("data-disabled")
    expect(screen.getByRole("option", { name: "Teamwork" })).toHaveAttribute("data-disabled")
  })

  it("adds to and removes from a multi-select filter", async () => {
    const user = userEvent.setup()
    const filter = tagsFilter(["assessment"])
    render(<FilterBar {...props()} filters={[filter]} />)

    await user.click(screen.getByRole("combobox", { name: "Tags" }))
    await screen.findByRole("listbox")
    expect(screen.queryByRole("option", { name: "Any tags" })).not.toBeInTheDocument()

    await user.click(screen.getByRole("option", { name: "Teamwork" }))
    expect(filter.onValueChange).toHaveBeenLastCalledWith(["assessment", "teamwork"])

    await user.click(screen.getByRole("option", { name: "Assessment" }))
    expect(filter.onValueChange).toHaveBeenLastCalledWith([])
  })

  it("reports a sort selection", async () => {
    const user = userEvent.setup()
    const p = props()
    render(<FilterBar {...p} />)

    await user.click(screen.getByRole("combobox", { name: "Sort" }))
    await screen.findByRole("listbox")
    await user.click(screen.getByRole("option", { name: "Oldest first" }))
    expect(p.onSortChange).toHaveBeenCalledWith("oldest")
  })

  it("uses defaults when optional display props are absent", () => {
    const p = props()
    render(<FilterBar {...p} filters={undefined} searchPlaceholder={undefined} />)

    expect(screen.getByRole("searchbox", { name: "Search..." })).toBeInTheDocument()
    expect(screen.queryByRole("combobox", { name: "University" })).not.toBeInTheDocument()
  })

  // How the members directory uses the bar: it filters on no status, so there is
  // nothing to tab between and an empty tab strip would just be furniture.
  it("renders no status tabs when the status props are omitted", () => {
    const { status, statusOptions, onStatusChange, ...withoutStatus } = props()
    render(<FilterBar {...withoutStatus} />)

    expect(screen.queryByRole("tablist")).not.toBeInTheDocument()
    expect(screen.queryAllByRole("tab")).toHaveLength(0)

    // The rest of the bar still works without them.
    expect(screen.getByRole("searchbox", { name: "Search proposals..." })).toBeInTheDocument()
    expect(screen.getByRole("combobox", { name: "University" })).toBeInTheDocument()
    expect(screen.getByRole("combobox", { name: "Sort" })).toBeInTheDocument()
  })

  it("renders no status tabs when the status options are empty", () => {
    const p = props()
    render(<FilterBar {...p} statusOptions={[]} />)

    expect(screen.queryByRole("tablist")).not.toBeInTheDocument()
    expect(screen.queryAllByRole("tab")).toHaveLength(0)
  })

  // The filters and sort still work either way; only their grouping changes.
  it("wraps the filters and sort in their own group only when asked to", () => {
    const { container, rerender } = render(<FilterBar {...props()} />)
    expect(container.querySelector('[data-slot="filter-bar-group"]')).not.toBeInTheDocument()

    rerender(<FilterBar {...props()} groupControls />)
    const group = container.querySelector('[data-slot="filter-bar-group"]')
    expect(group).toBeInTheDocument()
    expect(group).toContainElement(screen.getByRole("combobox", { name: "University" }))
    expect(group).toContainElement(screen.getByRole("combobox", { name: "Sort" }))
  })
})

describe("FilterBarSkeleton", () => {
  afterEach(() => {
    cleanup()
  })

  it("renders one placeholder per filter and one for the status tabs", () => {
    const { container } = render(<FilterBarSkeleton filterCount={2} statusCount={3} />)

    expect(container.querySelectorAll('[data-slot="filter-bar-skeleton-filter"]')).toHaveLength(2)
    expect(container.querySelector('[data-slot="filter-bar-skeleton-status"]')).toBeInTheDocument()
  })

  it("renders only the search and sort placeholders by default", () => {
    const { container } = render(<FilterBarSkeleton />)

    expect(container.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(2)
    expect(container.querySelector('[data-slot="filter-bar-skeleton-status"]')).toBeNull()
    expect(container.querySelector('[data-slot="filter-bar-skeleton-filter"]')).toBeNull()
  })

  it("sizes the status placeholder by the number of tabs", () => {
    const { container } = render(<FilterBarSkeleton statusCount={3} />)
    expect(container.querySelector('[data-slot="filter-bar-skeleton-status"]')).toHaveStyle({
      width: "18rem",
    })
  })

  it("leaves out the status placeholder when the bar has no tabs", () => {
    const { container } = render(<FilterBarSkeleton filterCount={2} />)
    expect(container.querySelector('[data-slot="filter-bar-skeleton-status"]')).toBeNull()
  })

  // Matches FilterBar's own groupControls, so the loading state doesn't jump
  // to a different row count once the real bar replaces it.
  it("wraps the filter and sort placeholders in their own group only when asked to", () => {
    const { container, rerender } = render(<FilterBarSkeleton filterCount={2} />)
    expect(container.querySelector('[data-slot="filter-bar-group"]')).not.toBeInTheDocument()

    rerender(<FilterBarSkeleton filterCount={2} groupControls />)
    const group = container.querySelector('[data-slot="filter-bar-group"]')
    expect(group).toBeInTheDocument()
    expect(group?.querySelectorAll('[data-slot="filter-bar-skeleton-filter"]')).toHaveLength(2)
  })
})
