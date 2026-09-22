import type { Route } from "next"
import Link from "next/link"
import type * as React from "react"

type StringHrefLinkProps = Omit<React.ComponentPropsWithRef<"a">, "href"> & { href: string }

/**
 * `next/link` for shared UI components that take a `linkComponent` with a plain `string` href.
 * `typedRoutes` rejects a plain `string`, so callers must build the href from `Routes`.
 */
export const StringHrefLink = ({ href, ...props }: StringHrefLinkProps) => (
  <Link href={href as Route} {...props} />
)
