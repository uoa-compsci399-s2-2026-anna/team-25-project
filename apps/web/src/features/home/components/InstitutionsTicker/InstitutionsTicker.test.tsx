import { cleanup, render } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { getInstitutionsWithLogosCached } from "@/features/institutions/institutions.queries"
import { InstitutionsTicker, InstitutionsTickerSkeleton } from "./InstitutionsTicker"

vi.mock("@/features/institutions/institutions.queries", () => ({
  getInstitutionsWithLogosCached: vi.fn(),
}))

const logo = (id: number, name: string, dimensions?: { width: number; height: number }) => ({
  id,
  name,
  logo: { id, url: `/payload/api/media/file/${name}.png`, ...dimensions },
})

describe("InstitutionsTicker", () => {
  afterEach(() => {
    cleanup()
  })

  it("renders nothing when no institution has a logo to show", async () => {
    vi.mocked(getInstitutionsWithLogosCached).mockResolvedValue([])

    const { container } = render(await InstitutionsTicker())
    expect(container).toBeEmptyDOMElement()
  })

  it("renders each logo", async () => {
    vi.mocked(getInstitutionsWithLogosCached).mockResolvedValue([
      logo(1, "uoa"),
      logo(2, "unsw"),
      logo(3, "monash"),
    ])

    const { container } = render(await InstitutionsTicker())
    // The marquee duplicates its children internally for a seamless loop.
    const sources = [...container.querySelectorAll("img")].map((img) => img.getAttribute("src"))
    expect(new Set(sources)).toEqual(
      new Set([
        "/payload/api/media/file/uoa.png",
        "/payload/api/media/file/unsw.png",
        "/payload/api/media/file/monash.png",
      ]),
    )
  })

  it("passes each logo's intrinsic size so the browser can reserve layout space", async () => {
    vi.mocked(getInstitutionsWithLogosCached).mockResolvedValue([
      logo(1, "uoa", { width: 300, height: 150 }),
    ])

    const { container } = render(await InstitutionsTicker())
    const img = container.querySelector("img") as HTMLImageElement
    expect(img).toHaveAttribute("width", "300")
    expect(img).toHaveAttribute("height", "150")
  })

  it("hides the decorative, duplicated marquee from assistive tech", async () => {
    vi.mocked(getInstitutionsWithLogosCached).mockResolvedValue([logo(1, "uoa")])

    const { container } = render(await InstitutionsTicker())
    expect(container.querySelector('[data-slot="ticker"]')).toHaveAttribute("aria-hidden", "true")
    // Images are decorative - the real names are announced once via the sr-only summary.
    expect(container.querySelector("img")).toHaveAttribute("alt", "")
  })

  it("gives assistive tech a non-duplicated summary of every institution", async () => {
    vi.mocked(getInstitutionsWithLogosCached).mockResolvedValue([logo(1, "uoa"), logo(2, "unsw")])

    const { getByText } = render(await InstitutionsTicker())
    expect(getByText("Our partner institutions: uoa, unsw")).toBeInTheDocument()
  })

  it("does not animate the ticker when there are fewer than 3 institutions", async () => {
    vi.mocked(getInstitutionsWithLogosCached).mockResolvedValue([logo(1, "uoa"), logo(2, "unsw")])

    const { container } = render(await InstitutionsTicker())
    const track = container.querySelector(".rfm-marquee") as HTMLElement
    expect(track.style.getPropertyValue("--play")).toBe("paused")
    expect(track.style.getPropertyValue("--min-width")).toBe("100%")
  })

  it("animates the ticker once there are at least 3 institutions", async () => {
    vi.mocked(getInstitutionsWithLogosCached).mockResolvedValue([
      logo(1, "uoa"),
      logo(2, "unsw"),
      logo(3, "monash"),
    ])

    const { container } = render(await InstitutionsTicker())
    const track = container.querySelector(".rfm-marquee") as HTMLElement
    expect(track.style.getPropertyValue("--play")).toBe("running")
    expect(track.style.getPropertyValue("--min-width")).toBe("auto")
  })
})

describe("InstitutionsTickerSkeleton", () => {
  it("renders placeholders", () => {
    const { container } = render(<InstitutionsTickerSkeleton />)
    expect(container.firstElementChild?.children).toHaveLength(8)
    cleanup()
  })
})
