import type { Route } from "next"

// Not in StartEditingOnLoad's "use client" module: a server component importing a value from
// there gets a client reference instead of the string.
export const EDIT_HASH = "edit"

/** Links to a page with its editor open. A fragment never reaches the server or its cache. */
export const withEditHash = <T extends string>(href: Route<T>) => `${href}#${EDIT_HASH}` as Route<T>
