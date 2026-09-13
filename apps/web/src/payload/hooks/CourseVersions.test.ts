import type { CourseVersion } from "@repo/shared/payload-types"
import { revalidateTag } from "next/cache"
import type { PayloadRequest } from "payload"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { lockDocument } from "@/lib/payload/lock"
import { Slugs } from "@/lib/payload/slugs"
import {
  assertVersionDeletable,
  prepareVersion,
  revalidateCourseVersions,
  revalidateDeletedCourseVersion,
  validatePublication,
  validateVersionChanges,
} from "./CourseVersions"
import { internal, isInternal, VERSION_WRITE, type VersionMetadataKey } from "./helpers"

vi.mock("@/lib/payload/lock", () => ({ lockDocument: vi.fn() }))
vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }))

const richText: CourseVersion["learningOutcomes"] = {
  root: {
    type: "root",
    version: 1,
    direction: null,
    format: "",
    indent: 0,
    children: [{ type: "text", text: "Content", version: 1 }],
  },
}

const complete: Partial<CourseVersion> = {
  name: "Course",
  programme: "BSc",
  deliveryFormat: "online",
  projectType: "Project",
  learningOutcomes: richText,
  assessments: richText,
  teachingTeam: [{ member: 1, role: "Lecturer" }],
}

describe("publication validation", () => {
  it.each([
    "name",
    "programme",
    "deliveryFormat",
    "projectType",
    "learningOutcomes",
    "assessments",
  ] as const)("requires %s", (key) => {
    expect(() => validatePublication({ ...complete, [key]: null })).toThrow(`${key} is required`)
  })
  it("rejects blank rich text and incomplete teaching rows", () => {
    expect(() =>
      validatePublication({
        ...complete,
        learningOutcomes: { root: { ...richText.root, children: [] } },
      }),
    ).toThrow("learningOutcomes")
    for (const teachingTeam of [[], [{ member: 1 }], [{ role: "Lecturer" }]]) {
      expect(() => validatePublication({ ...complete, teachingTeam })).toThrow("teaching team")
    }
  })
  it("does not treat row IDs, date formatting or a summary as content changes", () => {
    const previous = {
      ...complete,
      startDate: "2026-01-01T00:00:00.000Z",
      teachingTeam: [{ member: 1, role: "Lecturer", id: "old" }],
    } as CourseVersion

    expect(() =>
      validatePublication(
        {
          ...previous,
          startDate: "2026-01-01",
          teachingTeam: [{ member: 1, role: "Lecturer", id: "new" }],
          changeSummary: "No change",
        },
        previous,
      ),
    ).toThrow("no content changes")

    expect(() =>
      validatePublication(
        { ...previous, period: "Corrected", changeSummary: "Fix period" },
        previous,
      ),
    ).not.toThrow()
  })
})

describe("server-managed metadata", () => {
  const snapshot = { courseCode: "SE 101", institutionName: "UoA", teachingTeam: [] }
  const published = { publishedAt: "2026-01-01T00:00:00.000Z", displaySnapshot: snapshot }
  const latest = published as unknown as CourseVersion
  const sent = (...keys: VersionMetadataKey[]) => new Set(keys)

  // Payload's field pass fills every group before this hook runs, so `data` always
  // carries `displaySnapshot`. Only the recorded request says whether it was sent.
  it("ignores the empty group Payload fills in", () => {
    expect(() =>
      validateVersionChanges({ displaySnapshot: {}, assessments: null }, sent(), latest),
    ).not.toThrow()
  })

  it("rejects a sent value that differs from the stored one", () => {
    expect(() =>
      validateVersionChanges(
        { displaySnapshot: { ...snapshot, courseCode: "SE 999" } },
        sent("displaySnapshot"),
        latest,
      ),
    ).toThrow("displaySnapshot is server-managed")
  })

  it("allows a round-trip of the stored value", () => {
    expect(() =>
      validateVersionChanges({ ...published }, sent("publishedAt", "displaySnapshot"), latest),
    ).not.toThrow()
  })

  it("rejects an explicit null that would clear stored metadata", () => {
    expect(() =>
      validateVersionChanges({ publishedAt: null }, sent("publishedAt"), latest),
    ).toThrow("publishedAt is server-managed")
  })

  it("does not guard metadata while publishing, which rewrites it", () => {
    expect(() =>
      validateVersionChanges({ publishedAt: null }, sent("publishedAt"), latest, true),
    ).not.toThrow()
  })

  it("still refuses to move an offering to another course", () => {
    expect(() =>
      validateVersionChanges({ course: 2 }, sent(), {
        ...latest,
        course: 1,
      } as unknown as CourseVersion),
    ).toThrow("course cannot change")
  })
})

describe("publication content detection", () => {
  const node = (type: string) =>
    ({
      root: { ...richText.root, children: [{ type, version: 1 }] },
    }) as CourseVersion["learningOutcomes"]

  // Payload's default lexical feature set includes uploads and horizontal rules, so
  // a field can hold visible content without holding a single text node.
  it.each(["upload", "horizontalrule", "block"])("accepts a document of one %s node", (type) => {
    expect(() => validatePublication({ ...complete, learningOutcomes: node(type) })).not.toThrow()
  })

  it.each(["paragraph", "linebreak"])("still rejects a document of one %s node", (type) => {
    expect(() => validatePublication({ ...complete, learningOutcomes: node(type) })).toThrow(
      "learningOutcomes is required",
    )
  })

  it("still rejects whitespace-only text", () => {
    expect(() => validatePublication({ ...complete, name: "   " })).toThrow("name is required")
  })
})

describe("correction change summaries", () => {
  const previous = {
    ...complete,
    period: "S1",
    changeSummary: "Fixed assessment weighting",
  } as unknown as CourseVersion

  const correction = { ...previous, period: "S2" }

  it("rejects a summary carried over from the previous correction", () => {
    expect(() => validatePublication(correction, previous)).toThrow(
      "change summary describing this change",
    )
  })

  it("accepts a summary written for this correction", () => {
    expect(() =>
      validatePublication({ ...correction, changeSummary: "Moved to S2" }, previous),
    ).not.toThrow()
  })

  it("still rejects a missing summary", () => {
    expect(() => validatePublication({ ...correction, changeSummary: null }, previous)).toThrow(
      "A correction requires a change summary.",
    )
  })
})

describe("metadata comparison", () => {
  // Payload fills nullable fields and empty rows before validation, so a stored
  // value and the shape it round-trips as have to compare equal.
  const snapshot = {
    courseCode: "SE 101",
    institutionName: "UoA",
    teachingTeam: [{ name: "A Lecturer", role: "Lecturer" }],
  }
  const latest = { displaySnapshot: snapshot } as unknown as CourseVersion

  it("ignores nulls and empty arrays Payload adds inside the snapshot", () => {
    expect(() =>
      validateVersionChanges(
        {
          displaySnapshot: {
            ...snapshot,
            teachingTeam: [{ name: "A Lecturer", role: "Lecturer", id: null }],
            courseCode: "SE 101",
          },
        } as unknown as Partial<CourseVersion>,
        new Set(["displaySnapshot"]),
        latest,
      ),
    ).not.toThrow()
  })

  it("rejects a changed row inside the snapshot", () => {
    expect(() =>
      validateVersionChanges(
        {
          displaySnapshot: { ...snapshot, teachingTeam: [{ name: "Someone Else", role: "Tutor" }] },
        } as unknown as Partial<CourseVersion>,
        new Set(["displaySnapshot"]),
        latest,
      ),
    ).toThrow("displaySnapshot is server-managed")
  })

  it("treats an emptied array as unset, like Payload does", () => {
    expect(() =>
      validateVersionChanges(
        { displaySnapshot: { teachingTeam: [] } } as unknown as Partial<CourseVersion>,
        new Set(["displaySnapshot"]),
        {} as CourseVersion,
      ),
    ).not.toThrow()
  })

  it("allows the course when there is nothing stored to compare against", () => {
    expect(() => validateVersionChanges({ course: 2 }, new Set())).not.toThrow()
  })

  it("allows an update that omits the course", () => {
    expect(() =>
      validateVersionChanges({}, new Set(), { course: 1 } as unknown as CourseVersion),
    ).not.toThrow()
  })
})

const period = { period: "S1 2026", startDate: "2026-02-23", endDate: "2026-06-27" }

const publishable = { ...complete, ...period, course: 5 } as Partial<CourseVersion>

const course = { id: 5, code: "SE 101", institution: 3, owner: 42, editors: [] }

const editor = { id: 42, collection: Slugs.Collections.MEMBERS }
const administrator = { id: 1, collection: Slugs.Collections.ADMIN }

type Write = { draft: boolean; sentMetadataKeys: Set<VersionMetadataKey> }

const request = ({
  user = editor as unknown,
  current = undefined as unknown,
  write = { draft: false, sentMetadataKeys: new Set() } as Write | null,
  hasPublishedVersion = false,
} = {}) => {
  // The nested course update re-enters prepareCourse, which refuses server-managed
  // metadata from a caller. Recording the guard at call time is what proves the write
  // is exempt; the mock cannot fail the way the real hook chain would.
  const internalAtUpdate: boolean[] = []
  const update = vi.fn(async () => {
    internalAtUpdate.push(isInternal())
    return {}
  })
  const findByID = vi.fn(async ({ collection }: { collection: string }) => {
    if (collection === Slugs.Collections.COURSE_VERSIONS) return current
    if (collection === Slugs.Collections.MEMBERS)
      return { id: 42, firstName: "Ada", lastName: "Lovelace" }
    return { id: 3, name: "University of Auckland" }
  })

  vi.mocked(lockDocument).mockResolvedValue({ ...course, hasPublishedVersion } as never)

  return {
    req: {
      user,
      context: write ? { [VERSION_WRITE]: write } : {},
      payload: { findByID, update },
    } as unknown as PayloadRequest,
    findByID,
    update,
    internalAtUpdate,
  }
}

const prepare = (
  req: PayloadRequest,
  data: Partial<CourseVersion> | undefined,
  operation: "create" | "update" = "create",
  originalDoc?: Partial<CourseVersion>,
) =>
  prepareVersion({ data, operation, originalDoc, req } as unknown as Parameters<
    typeof prepareVersion
  >[0]) as Promise<Partial<CourseVersion>>

beforeEach(() => {
  vi.mocked(lockDocument).mockReset()
  vi.mocked(revalidateTag).mockReset()
})

describe("course version cache revalidation", () => {
  it.each([revalidateCourseVersions, revalidateDeletedCourseVersion])(
    "marks its course queries stale after a write",
    async (hook) => {
      const doc = { id: 9, course: 7 } as CourseVersion
      const result = await hook({ doc, req: { context: {} } } as never)

      expect(revalidateTag).toHaveBeenCalledWith("courses", "max")
      expect(revalidateTag).toHaveBeenCalledWith("courses:7", "max")
      expect(result).toBe(doc)
    },
  )

  it.each([revalidateCourseVersions, revalidateDeletedCourseVersion])(
    "can skip revalidation through request context",
    async (hook) => {
      const doc = { id: 9, course: 7 } as CourseVersion
      await hook({ doc, req: { context: { disableRevalidate: true } } } as never)

      expect(revalidateTag).not.toHaveBeenCalled()
    },
  )
})

describe("prepareVersion guards", () => {
  it("returns data untouched when there is none", async () => {
    const { req } = request()
    await expect(prepare(req, undefined)).resolves.toBeUndefined()
  })

  // A nested server write was authorised by the operation that started it.
  it("returns data untouched for an internal write", async () => {
    const { req } = request()
    const data = { publishedAt: "2026-01-01T00:00:00.000Z" }

    await expect(internal.run(true, () => prepare(req, data))).resolves.toBe(data)
    expect(lockDocument).not.toHaveBeenCalled()
  })

  it("locks the course and refuses a caller who cannot edit it", async () => {
    const { req } = request({ user: { id: 9, collection: Slugs.Collections.MEMBERS } })

    await expect(prepare(req, publishable)).rejects.toThrow("You cannot edit this course.")
    expect(lockDocument).toHaveBeenCalledWith(req, Slugs.Collections.COURSES, 5)
  })

  it("reports an update of an offering that is not there", async () => {
    const { req } = request()
    await expect(prepare(req, { period: "S2" }, "update")).rejects.toThrow(
      "This offering was not found.",
    )
  })

  // guardCourseWrite records the raw request; without it, no later check can tell a
  // key the caller sent from one Payload filled in.
  it("refuses a write that did not pass through the operation hook", async () => {
    const { req } = request({ write: null })

    await expect(prepare(req, publishable)).rejects.toThrow(
      "did not pass through the course operation hook",
    )
  })

  it("overwrites the course with the one it locked", async () => {
    const { req } = request()
    await expect(prepare(req, { ...publishable, course: 99 })).resolves.toMatchObject({ course: 5 })
  })

  it.each([
    ["a missing period label", { period: "  " }],
    ["an unparseable start date", { startDate: "not a date" }],
    ["a missing start date", { startDate: null }],
    ["a missing end date", { endDate: null }],
  ])("refuses %s", async (_label, change) => {
    const { req } = request()

    await expect(
      prepare(req, { ...publishable, ...change } as unknown as Partial<CourseVersion>),
    ).rejects.toThrow("A period label and valid start and end dates are required.")
  })

  it("refuses an end date before the start date", async () => {
    const { req } = request()

    await expect(
      prepare(req, { ...publishable, startDate: "2026-06-27", endDate: "2026-02-23" }),
    ).rejects.toThrow("The end date cannot precede the start date.")
  })

  // The period a partial update omits is the saved one, not a missing one.
  it("validates the period against the saved offering", async () => {
    const latest = { id: 3, course: 5, ...period } as unknown as CourseVersion
    const { req } = request({ current: latest })

    await expect(prepare(req, { name: "Renamed" }, "update", latest)).resolves.toMatchObject({
      name: "Renamed",
    })
  })
})

describe("prepareVersion drafts", () => {
  it("creates a draft with no period or dates yet - a draft only needs a course", async () => {
    const { req } = request({ write: { draft: true, sentMetadataKeys: new Set() } })

    await expect(prepare(req, { course: 5, name: "Working title" })).resolves.toMatchObject({
      name: "Working title",
    })
  })

  it("still refuses a plain (non-draft) create with no period or dates", async () => {
    const { req } = request()

    await expect(prepare(req, { course: 5, name: "Working title" })).rejects.toThrow(
      "A period label and valid start and end dates are required.",
    )
  })

  it("drops the metadata keys a draft write carries", async () => {
    const { req } = request()
    const data = {
      ...publishable,
      publishedAt: "2026-01-01T00:00:00.000Z",
      publishedBy: null,
      displaySnapshot: {},
    } as Partial<CourseVersion>

    const result = await prepare(req, data)
    expect(result).not.toHaveProperty("publishedAt")
    expect(result).not.toHaveProperty("publishedBy")
    expect(result).not.toHaveProperty("displaySnapshot")
  })

  it("keeps a publication in place while a draft is saved against it", async () => {
    const published = {
      id: 3,
      course: 5,
      _status: "published",
      ...period,
    } as unknown as CourseVersion
    const { req, update } = request({
      current: published,
      write: { draft: true, sentMetadataKeys: new Set() },
    })

    await expect(prepare(req, { name: "Draft edit" }, "update", published)).resolves.toMatchObject({
      name: "Draft edit",
    })
    expect(update).not.toHaveBeenCalled()
  })

  // Any write that lands in the draft state and is not a draft save would withdraw
  // the publication, which is a separate workflow.
  it("refuses a write that would unpublish an offering", async () => {
    const published = {
      id: 3,
      course: 5,
      _status: "published",
      ...period,
    } as unknown as CourseVersion
    const { req } = request({ current: published })

    await expect(
      prepare(req, { _status: "draft", ...period }, "update", published),
    ).rejects.toThrow("Unpublishing is not supported.")
  })

  // `originalDoc` is the newest revision, draft included, while the read under the lock
  // returns the publication. When an offering has a pending draft the two disagree, and
  // only the publication may decide the outcome. Reading the newest revision instead
  // would call every one of these writes an unpublish.
  describe("with a published offering that has a pending draft", () => {
    const publishedRow = {
      id: 3,
      course: 5,
      _status: "published",
      ...complete,
      ...period,
    } as unknown as CourseVersion

    const pendingDraft = { ...publishedRow, _status: "draft", name: "Pending" } as CourseVersion

    it("treats a plain edit as a correction, not an unpublish", async () => {
      const { req } = request({ current: publishedRow })

      // Republishing is what rewrites the metadata, so its presence is the proof.
      const result = await prepare(
        req,
        { name: "Corrected", changeSummary: "Fix the name" },
        "update",
        pendingDraft,
      )

      expect(Date.parse(result.publishedAt as string)).not.toBeNaN()
      expect(result.displaySnapshot).toBeDefined()
    })

    it("still saves a draft as a draft", async () => {
      const { req, update } = request({
        current: publishedRow,
        write: { draft: true, sentMetadataKeys: new Set() },
      })

      await expect(
        prepare(req, { name: "Still drafting" }, "update", pendingDraft),
      ).resolves.toMatchObject({ name: "Still drafting" })
      expect(update).not.toHaveBeenCalled()
    })

    it("still refuses an explicit unpublish", async () => {
      const { req } = request({ current: publishedRow })

      await expect(prepare(req, { _status: "draft" }, "update", pendingDraft)).rejects.toThrow(
        "Unpublishing is not supported.",
      )
    })
  })

  // A ?draft=true request that publishes outright is a publication, not a draft save.
  it("publishes a draft request that sends an explicit published status", async () => {
    const { req, update } = request({
      write: { draft: true, sentMetadataKeys: new Set() },
    })

    await expect(prepare(req, { ...publishable, _status: "published" })).resolves.toMatchObject({
      _status: "published",
    })
    expect(update).toHaveBeenCalled()
  })
})

describe("prepareVersion publication", () => {
  it("writes the metadata and snapshots what the offering displays", async () => {
    const { req, update } = request()

    const result = await prepare(req, { ...publishable, _status: "published" })

    expect(result.displaySnapshot).toEqual({
      courseCode: "SE 101",
      institutionName: "University of Auckland",
      teachingTeam: [{ name: "Ada Lovelace", role: "Lecturer", memberId: 1 }],
    })
    expect(result.publishedBy).toEqual({ relationTo: Slugs.Collections.MEMBERS, value: 42 })
    expect(Date.parse(result.publishedAt as string)).not.toBeNaN()
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: Slugs.Collections.COURSES,
        id: 5,
        data: { hasPublishedVersion: true },
      }),
    )
  })

  // The nested update re-enters prepareCourse, which refuses a caller-supplied
  // hasPublishedVersion. Without the internal guard around it, publishing a course's
  // first offering would fail on "Publication metadata is server-managed."
  it("marks the course published as an internal write", async () => {
    const { req, update, internalAtUpdate } = request()

    await prepare(req, { ...publishable, _status: "published" })

    expect(update).toHaveBeenCalledOnce()
    expect(internalAtUpdate).toEqual([true])
  })

  // The guard must not outlive the nested operation it exempts.
  it("clears the internal guard once publication returns", async () => {
    const { req } = request()

    await prepare(req, { ...publishable, _status: "published" })
    expect(isInternal()).toBe(false)
  })

  it("records an admin publisher against the admin collection", async () => {
    const { req } = request({ user: administrator })

    const result = await prepare(req, { ...publishable, _status: "published" })
    expect(result.publishedBy).toEqual({ relationTo: Slugs.Collections.ADMIN, value: 1 })
  })

  it("leaves a course that is already advertised alone", async () => {
    const { req, update } = request({ hasPublishedVersion: true })

    await prepare(req, { ...publishable, _status: "published" })
    expect(update).not.toHaveBeenCalled()
  })

  it("refuses a publication that is missing required content", async () => {
    const { req, update } = request()

    await expect(
      prepare(req, { ...publishable, _status: "published", assessments: null }),
    ).rejects.toThrow("assessments is required for publication.")
    expect(update).not.toHaveBeenCalled()
  })

  // A write to a published offering that does not say otherwise republishes it, so
  // it is a correction and carries a correction's requirements.
  it("treats an edit of a published offering as a correction", async () => {
    const published = {
      id: 3,
      course: 5,
      _status: "published",
      ...publishable,
    } as unknown as CourseVersion
    const { req } = request({ current: published })

    await expect(prepare(req, { name: "Renamed" }, "update", published)).rejects.toThrow(
      "A correction requires a change summary.",
    )
  })

  it("publishes a correction that says what changed", async () => {
    const published = {
      id: 3,
      course: 5,
      _status: "published",
      ...publishable,
    } as unknown as CourseVersion
    const { req } = request({ current: published, hasPublishedVersion: true })

    const result = await prepare(
      req,
      { name: "Renamed", changeSummary: "Corrected the title" },
      "update",
      published,
    )
    expect(result.publishedAt).toBeDefined()
  })

  it("refuses a teaching row whose member is not a relationship", async () => {
    const { req } = request()

    await expect(
      prepare(req, {
        ...publishable,
        _status: "published",
        teachingTeam: [{ member: "not an id", role: "Lecturer" }],
      } as unknown as Partial<CourseVersion>),
    ).rejects.toThrow("teaching team")
  })
})

describe("assertVersionDeletable", () => {
  const remove = (req: PayloadRequest) =>
    assertVersionDeletable({ id: 3, req } as unknown as Parameters<
      typeof assertVersionDeletable
    >[0])

  it("deletes a draft that was never published", async () => {
    const { req } = request({ current: { id: 3, course: 5, _status: "draft" } })

    await expect(remove(req)).resolves.toBeUndefined()
    expect(lockDocument).toHaveBeenCalledWith(req, Slugs.Collections.COURSES, 5)
  })

  it("refuses a caller who cannot edit the course", async () => {
    const { req } = request({
      user: { id: 9, collection: Slugs.Collections.MEMBERS },
      current: { id: 3, course: 5, _status: "draft" },
    })

    await expect(remove(req)).rejects.toThrow("You cannot edit this course.")
  })

  it.each([
    ["a published offering", { _status: "published" }],
    ["one that has been published before", { publishedAt: "2026-01-01T00:00:00.000Z" }],
  ])("refuses %s", async (_label, state) => {
    const { req } = request({ current: { id: 3, course: 5, ...state } })

    await expect(remove(req)).rejects.toThrow("Published offerings cannot be deleted.")
  })

  // The status is read again under the lock, so a publication that lands between
  // the authorisation read and the check is still seen.
  it("re-reads the offering under the lock", async () => {
    const { req, findByID } = request({ current: { id: 3, course: 5, _status: "draft" } })

    await remove(req)
    expect(findByID).toHaveBeenCalledTimes(2)
  })
})
