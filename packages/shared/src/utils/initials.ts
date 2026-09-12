export const initials = (firstName: string, lastName: string) =>
  `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase()

/**
 * Last two words, since these names usually carry a title ("Dr Anna Tui").
 * Spread so an astral-plane initial survives, and "?" so a blank name shows something.
 */
export const initialsFromName = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((part) => [...part].slice(0, 1).join(""))
    .join("")
    .toUpperCase() || "?"
