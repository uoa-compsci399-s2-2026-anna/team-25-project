"use client"

import { useEffect } from "react"
import { useEdit } from "./EditContext"
import { EDIT_HASH } from "./editOnLoad"

/**
 * Starts editing when the page was opened with #edit (see withEditHash), then drops the
 * fragment so a refresh or Back doesn't reopen the editor.
 *
 * Render it only where the viewer may edit - next to the Edit button - so the fragment does
 * nothing for anyone else. Saving is still checked on the server either way.
 */
export const StartEditingOnLoad = () => {
  const { startEditing } = useEdit()

  // Reruns whenever startEditing changes, but only the first run finds the fragment - it's
  // removed straight away.
  useEffect(() => {
    if (window.location.hash !== `#${EDIT_HASH}`) return
    startEditing()
    const { pathname, search } = window.location
    window.history.replaceState(window.history.state, "", `${pathname}${search}`)
  }, [startEditing])

  return null
}
