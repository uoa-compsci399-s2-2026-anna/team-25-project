import type { Route } from "next"
import { createLoader, createParser } from "nuqs/server"
import { Routes } from "@/lib/routes"

/** Search param that tells the auth pages and the proxy where to send the user after auth. */
export const REDIRECT_PARAM = "redirect"

// Any origin works here - it only has to be fixed so a value that resolves to
// another host (e.g. "//evil.com", "/\evil.com") shows up as a changed origin.
const BASE = "http://localhost"

const authRoutes = new Set<string>([Routes.LOGIN, Routes.REGISTER.ROOT, Routes.REGISTER.PROFILE])

export const isAuthRoute = (pathname: string) => authRoutes.has(pathname)

/**
 * Returns the value as an in-app path, or null when it is not safe to redirect
 * to: a value that leaves the site would make the param an open redirect, and
 * an auth page would send the user straight back into the flow they finished.
 * The path is normalised and the hash is dropped.
 */
export const safeRedirect = (value: string | null | undefined): Route | null => {
  if (!value?.startsWith("/")) return null

  let url: URL
  try {
    url = new URL(value, BASE)
  } catch {
    return null
  }

  // Dot segments collapse during parsing, so "/.//evil.com" passes the origin
  // check but leaves "//evil.com", which a browser reads as another host.
  if (url.origin !== BASE || url.pathname.startsWith("//") || isAuthRoute(url.pathname)) {
    return null
  }
  return `${url.pathname}${url.search}` as Route
}

export const redirectTarget = (value: string | null | undefined): Route =>
  safeRedirect(value) ?? Routes.HOME

/**
 * Adds the redirect param to an auth route. Returns the bare route when the
 * target is home or is not safe.
 */
export const withRedirect = (authRoute: Route, target: string | null | undefined): Route => {
  const safe = safeRedirect(target)
  if (!safe || safe === Routes.HOME) return authRoute
  return `${authRoute}?${new URLSearchParams({ [REDIRECT_PARAM]: safe })}` as Route
}

export const parseAsRedirect = createParser({
  parse: safeRedirect,
  serialize: String,
})

export const loadRedirectParam = createLoader({ [REDIRECT_PARAM]: parseAsRedirect })
