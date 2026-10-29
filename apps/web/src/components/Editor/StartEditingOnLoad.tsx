"use client"

import { useEffect } from "react"
import { useEdit } from "./EditContext"
import { EDIT_HASH } from "./editOnLoad"

/** Starts editing when the page opens with #edit, then drops it so a refresh doesn't. */
export const StartEditingOnLoad = () => {
  const { startEditing } = useEdit()

  useEffect(() => {
    if (window.location.hash !== `#${EDIT_HASH}`) return
    startEditing()
    const { pathname, search } = window.location
    // Not `window.history.state`: Next.js skips its router sync for its own state, and
    // the router then writes #edit back on its next update.
    window.history.replaceState(null, "", `${pathname}${search}`)
  }, [startEditing])

  return null
}
