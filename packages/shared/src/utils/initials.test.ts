import { describe, expect, it } from "vitest"
import { initials, initialsFromName } from "./initials"

describe("initials", () => {
  it.each([
    ["Anna", "Tui", "AT"],
    ["anna", "tui", "AT"],
    ["Élodie", "Ng", "ÉN"],
    ["Anna", "", "A"],
    ["", "Tui", "T"],
    ["", "", ""],
  ])("returns the initials for %j and %j", (firstName, lastName, expected) => {
    expect(initials(firstName, lastName)).toBe(expected)
  })
})

describe("initialsFromName", () => {
  it.each([
    ["Dr Anna Tui", "AT"],
    ["Professor Mary Jane Watson", "JW"],
    ["Anna Tui", "AT"],
    ["anna tui", "AT"],
    ["Anna", "A"],
    ["  Dr   Āta\nTui  ", "ĀT"],
    ["😀 Tui", "😀T"],
  ])("returns initials from the last two words in %j", (name, expected) => {
    expect(initialsFromName(name)).toBe(expected)
  })

  it.each(["", " ", "\t\n"])("returns a placeholder for the blank name %j", (name) => {
    expect(initialsFromName(name)).toBe("?")
  })
})
