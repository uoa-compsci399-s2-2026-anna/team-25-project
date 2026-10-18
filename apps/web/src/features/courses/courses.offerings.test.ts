import { describe, expect, it } from "vitest"
import { currentOffering, offeringTiming, selectOffering } from "./courses.offerings"

const offering = (id: number, startDate: string, endDate: string) => ({ id, startDate, endDate })

// Newest first, as getPublishedOfferings sorts them.
const s1_2027 = offering(4, "2027-03-01", "2027-06-25")
const s2_2026 = offering(3, "2026-07-20", "2026-11-06")
const s1_2026 = offering(2, "2026-03-02", "2026-06-26")
const s2_2025 = offering(1, "2025-07-21", "2025-11-07")
const offerings = [s1_2027, s2_2026, s1_2026, s2_2025]

const midSemester2 = new Date("2026-10-18T00:00:00Z")

describe("offeringTiming", () => {
  it.each([
    ["upcoming", s1_2027],
    ["inProgress", s2_2026],
    ["ended", s1_2026],
  ])("calls it %s", (timing, subject) => {
    expect(offeringTiming(subject, midSemester2)).toBe(timing)
  })

  it("counts the start and end days themselves as in progress", () => {
    expect(offeringTiming(s2_2026, new Date("2026-07-20T00:00:00Z"))).toBe("inProgress")
    expect(offeringTiming(s2_2026, new Date("2026-11-06T00:00:00Z"))).toBe("inProgress")
  })

  it("never ends an offering with no end date", () => {
    const openEnded = { startDate: "2020-01-01", endDate: null } as unknown as Parameters<
      typeof offeringTiming
    >[0]
    expect(offeringTiming(openEnded, midSemester2)).toBe("inProgress")
  })
})

describe("currentOffering", () => {
  // Publishing next year's offering early must not hide the one being taught.
  it("is the newest offering that has started, not the newest published", () => {
    expect(currentOffering(offerings, midSemester2)).toBe(s2_2026)
  })

  it("stays on the latest one between semesters", () => {
    expect(currentOffering(offerings, new Date("2026-12-01T00:00:00Z"))).toBe(s2_2026)
  })

  it("falls back to the soonest upcoming offering when none has started", () => {
    expect(currentOffering([s1_2027, s2_2026], new Date("2026-01-01T00:00:00Z"))).toBe(s2_2026)
  })

  it("is undefined for a course with no offerings", () => {
    expect(currentOffering([], midSemester2)).toBeUndefined()
  })
})

describe("selectOffering", () => {
  it("shows the current offering when none is asked for", () => {
    expect(selectOffering(offerings, null, midSemester2)).toEqual({
      offerings,
      selected: s2_2026,
      current: s2_2026,
    })
  })

  it("shows the offering asked for, keeping track of the current one", () => {
    const { selected, current } = selectOffering(offerings, s2_2025.id, midSemester2)
    expect(selected).toBe(s2_2025)
    expect(current).toBe(s2_2026)
  })

  // Another course's offering, or one never published, isn't in the list.
  it("falls back to the current offering for an id the course doesn't have", () => {
    expect(selectOffering(offerings, 99, midSemester2).selected).toBe(s2_2026)
  })
})
