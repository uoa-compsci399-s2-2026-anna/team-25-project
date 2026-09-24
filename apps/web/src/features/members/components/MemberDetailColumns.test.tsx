import { isValidElement, type ReactElement, type ReactNode, Suspense } from "react"
import { describe, expect, it, vi } from "vitest"
import { MemberBio } from "./MemberDetailBio"
import { MemberContacts, MemberContactsSkeleton } from "./MemberDetailContacts"
import { MemberDetailLeftColumn } from "./MemberDetailLeftColumn"
import { MemberProposals, MemberProposalsSkeleton } from "./MemberDetailProposals"
import { MemberPublications } from "./MemberDetailPublications"
import { MemberDetailRightColumn } from "./MemberDetailRightColumn"
import { MemberStats, MemberStatsSkeleton } from "./MemberDetailStats"

// The async children never run here - the columns are checked as element trees.
vi.mock("../members.queries", () => ({}))
vi.mock("@/lib/payload/getCurrentUser", () => ({}))

type Props = { children?: ReactNode; fallback?: ReactNode; params?: unknown }

const childrenOf = (element: ReactElement<Props>) =>
  (Array.isArray(element.props.children)
    ? element.props.children
    : [element.props.children]) as ReactElement<Props>[]

// Each Suspense boundary as [the component it wraps, its fallback's component].
const boundaries = (column: ReactElement<Props>) =>
  childrenOf(column)
    .filter((child) => child.type === Suspense)
    .map((boundary) => {
      const [inner] = childrenOf(boundary)
      const fallback = boundary.props.fallback
      return [inner?.type, isValidElement(fallback) ? fallback.type : undefined]
    })

const params = Promise.resolve({ memberId: "7" })

describe("MemberDetailLeftColumn", () => {
  it("streams the bio and proposals, then the publications", () => {
    const column = MemberDetailLeftColumn({ params }) as ReactElement<Props>

    expect(boundaries(column)).toEqual([
      [MemberBio, undefined],
      [MemberProposals, MemberProposalsSkeleton],
    ])
    expect(childrenOf(column).at(-1)?.type).toBe(MemberPublications)
  })

  it("passes the route params to each async section", () => {
    const column = MemberDetailLeftColumn({ params }) as ReactElement<Props>

    for (const boundary of childrenOf(column).filter((child) => child.type === Suspense)) {
      expect(childrenOf(boundary)[0]?.props.params).toBe(params)
    }
  })
})

describe("MemberDetailRightColumn", () => {
  it("streams contacts then stats, each with its skeleton", () => {
    const column = MemberDetailRightColumn({ params }) as ReactElement<Props>

    expect(column.type).toBe("aside")
    expect(boundaries(column)).toEqual([
      [MemberContacts, MemberContactsSkeleton],
      [MemberStats, MemberStatsSkeleton],
    ])
  })
})
