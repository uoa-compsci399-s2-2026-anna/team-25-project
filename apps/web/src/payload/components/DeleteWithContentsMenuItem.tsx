"use client"

import {
  ConfirmationModal,
  PopupList,
  toast,
  useConfig,
  useDocumentInfo,
  useDocumentTitle,
  useForm,
  useModal,
} from "@payloadcms/ui"
import type { Route } from "next"
import { useRouter } from "next/navigation"
import { formatAdminURL } from "payload/shared"
import type { ActionResult } from "@/features/auth/actions/types"
import { deleteCourse } from "@/features/courses/actions/deleteCourse"
import { deleteResourceAndAttachments } from "@/features/resources/actions/deleteResourceAndAttachments"

type DeleteWithContentsMenuItemProps = {
  label: string
  /** What goes with the document, and what stays. Shown above "This can't be undone." */
  consequences: string
  onDelete: (id: number) => Promise<ActionResult>
}

/**
 * Takes the place of the admin panel's own Delete in the edit view's ⋯ menu, which
 * admins don't get on these collections (see courseDelete and resourceDelete). It
 * deletes the document with what belongs to it in one server action, so the admin
 * doesn't have to clear those out first.
 */
function DeleteWithContentsMenuItem({
  label,
  consequences,
  onDelete,
}: DeleteWithContentsMenuItemProps) {
  const { id, collectionSlug } = useDocumentInfo()
  const { title } = useDocumentTitle()
  const { setModified } = useForm()
  const { openModal } = useModal()
  const router = useRouter()
  const {
    config: {
      routes: { admin: adminRoute },
    },
  } = useConfig()

  if (typeof id !== "number") return null
  const modalSlug = `delete-with-contents-${id}`

  const confirmDelete = async () => {
    // ConfirmationModal doesn't catch, so a thrown action would leave it stuck on "Deleting…".
    let result: ActionResult
    try {
      result = await onDelete(id)
    } catch {
      toast.error("Could not reach the server. Reload the page and try again.")
      return
    }
    if (!result.ok) {
      toast.error(result.formError ?? "Could not delete this. Try again.")
      return
    }

    // Stops the unsaved-changes prompt from blocking the redirect.
    setModified(false)
    toast.success(`${title} was deleted.`)
    // Admin routes sit outside the app's typed routes.
    router.push(formatAdminURL({ adminRoute, path: `/collections/${collectionSlug}` }) as Route)
  }

  return (
    <>
      <PopupList.Button onClick={() => openModal(modalSlug)}>{label}</PopupList.Button>
      <ConfirmationModal
        body={
          <p>
            You are about to delete <strong>{title}</strong>. {consequences} This can't be undone.
          </p>
        }
        confirmingLabel="Deleting…"
        confirmLabel={label}
        heading={`${label}?`}
        modalSlug={modalSlug}
        onConfirm={confirmDelete}
      />
    </>
  )
}

export const DeleteCourseMenuItem = () => (
  <DeleteWithContentsMenuItem
    consequences="All of its offerings go with it, published ones included. Resources linked to it are kept, without the link."
    label="Delete course and offerings"
    onDelete={(courseId) => deleteCourse({ courseId })}
  />
)

export const DeleteResourceMenuItem = () => (
  <DeleteWithContentsMenuItem
    consequences="Its attached files go with it, except any that another resource also uses."
    label="Delete resource and files"
    onDelete={(resourceId) => deleteResourceAndAttachments({ resourceId })}
  />
)
