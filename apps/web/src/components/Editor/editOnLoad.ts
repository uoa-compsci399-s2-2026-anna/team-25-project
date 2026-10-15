import type { Route } from "next"

// Kept out of StartEditingOnLoad's "use client" module: a server component importing a value
// from there gets a client reference, not the string.

/** The URL fragment that opens a page's editor on arrival, e.g. /proposals/2-slug#edit. */
export const EDIT_HASH = "edit"

/**
 * Links to `href` with its editor open. A fragment rather than a search param: it never
 * reaches the server, so it doesn't touch rendering or caching.
 */
export const withEditHash = <T extends string>(href: Route<T>) => `${href}#${EDIT_HASH}` as Route<T>
