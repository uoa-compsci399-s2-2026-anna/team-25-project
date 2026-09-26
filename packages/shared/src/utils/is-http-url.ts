/** Rejects `javascript:` and other schemes that are unsafe or useless as a profile link's href. */
export const isHttpUrl = (value: string): boolean => {
  try {
    const { protocol } = new URL(value)
    return protocol === "http:" || protocol === "https:"
  } catch {
    return false
  }
}
