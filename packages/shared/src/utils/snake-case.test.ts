import { describe, expect, it } from "vitest"
import { snakeCase } from "./snake-case"

describe("snakeCase", () => {
  it.each([
    ["courseVersions", "course_versions"],
    ["courses", "courses"],
    ["CourseVersions", "course_versions"],
    ["kebab-case-name", "kebab_case_name"],
    ["dot.separated.name", "dot_separated_name"],
    ["colon:separated", "colon_separated"],
    ["  padded words  ", "padded_words"],
    ["already_snake_case", "already_snake_case"],
    ["version2Field", "version2_field"],
    ["courseVersionsV2", "course_versions_v2"],
    ["", ""],
  ])("converts %j to %j", (input, expected) => {
    expect(snakeCase(input)).toBe(expected)
  })

  // Payload's `to-snake-case` gives every capital in a run its own word. These
  // spellings look wrong but are the names Payload actually creates tables and
  // columns under, so the lookups in `db.ts` depend on matching them.
  it.each([
    ["APIKey", "a_p_i_key"],
    ["HTTPServerError", "h_t_t_p_server_error"],
    ["XYZabc", "x_y_zabc"],
    ["XMLHttpRequest", "x_m_l_http_request"],
    ["ABC", "abc"],
    ["aB", "a_b"],
  ])("splits the run of capitals in %j to %j", (input, expected) => {
    expect(snakeCase(input)).toBe(expected)
  })

  it("collapses runs of separators into a single underscore", () => {
    expect(snakeCase("a - b . c")).toBe("a_b_c")
  })
})
