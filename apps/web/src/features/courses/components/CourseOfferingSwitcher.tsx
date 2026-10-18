"use client"

import {
  CourseOfferingSwitcher as CourseOfferingSwitcherBase,
  type CourseOfferingSwitcherOption,
} from "@repo/ui/components/composite"
import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { Routes } from "@/lib/routes"

export interface CourseOfferingSwitcherProps {
  courseId: number
  /** Newest first, as the sidebar lists them. */
  options: CourseOfferingSwitcherOption[]
  selectedId: number
  /** Its URL is the plain course URL rather than `?offering=`. */
  currentId: number
}

/**
 * Navigates between a course's offerings. The sidebar lists the same offerings
 * as links, but it stacks below the content on narrow screens, so this keeps
 * the choice up beside the period badge.
 */
export function CourseOfferingSwitcher({
  courseId,
  options,
  selectedId,
  currentId,
}: CourseOfferingSwitcherProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  return (
    <CourseOfferingSwitcherBase
      onSelect={(id) =>
        startTransition(() =>
          router.push(Routes.COURSES.OFFERING(courseId, id, currentId), { scroll: false }),
        )
      }
      options={options}
      pending={pending}
      selectedId={selectedId}
    />
  )
}
