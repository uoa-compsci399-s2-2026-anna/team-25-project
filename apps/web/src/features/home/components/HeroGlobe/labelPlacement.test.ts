import { describe, expect, it } from "vitest"
import type { GlobeMarker } from "../../globe.queries"
import { labelBelow } from "./labelPlacement"

const marker = (id: string, lat: number, lng: number): GlobeMarker => ({
  id,
  location: [lat, lng],
  label: id,
})

const sydney = marker("sydney", -33.92, 151.23)
const melbourne = marker("melbourne", -37.8, 144.96)
const auckland = marker("auckland", -36.85, 174.77)
const perth = marker("perth", -31.95, 115.86)

describe("labelBelow", () => {
  it("drops the southern label of a close pair below its marker", () => {
    expect(labelBelow([sydney, melbourne])).toEqual(new Set(["melbourne"]))
  })

  it("keeps labels above when markers are far apart", () => {
    expect(labelBelow([perth, auckland])).toEqual(new Set())
  })

  it("keeps a lone marker's label above", () => {
    expect(labelBelow([sydney])).toEqual(new Set())
  })
})
