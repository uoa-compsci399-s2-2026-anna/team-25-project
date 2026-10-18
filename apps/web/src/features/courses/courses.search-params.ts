// `nuqs/server` carries no "use client" boundary, so these parsers work in server and client code.
import { createLoader } from "nuqs/server"
import { parseAsPositiveInteger } from "@/lib/search-params"

/** `offering` picks one of the course's offerings; without it the page shows its current one. */
export const courseSearchParams = {
  offering: parseAsPositiveInteger,
}

export const loadCourseSearchParams = createLoader(courseSearchParams)
