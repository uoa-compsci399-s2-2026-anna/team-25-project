import type { Route } from "next"

export function route<T extends string>(path: Route<T>): Route<T> {
  return path
}

export const Routes = {
  HOME: route("/"),
  COURSES: {
    ROOT: route("/courses"),
    COURSE: (courseId: string) => route(`/courses/${courseId}`),
  },
  MEMBERS: {
    ROOT: route("/members"),
    MEMBER: (memberId: string) => route(`/members/${memberId}`),
  },
  PROPOSALS: {
    ROOT: route("/proposals"),
    PROPOSAL: (proposalId: string) => route(`/proposals/${proposalId}`),
  },
  ABOUT: route("/about"),
  PRIVACY: route("/privacy"),
} as const

type DeepValues<T> = T extends (...args: never[]) => infer R
  ? R
  : T extends object
    ? { [K in keyof T]: DeepValues<T[K]> }[keyof T]
    : T

export type AppRoute = DeepValues<typeof Routes>
