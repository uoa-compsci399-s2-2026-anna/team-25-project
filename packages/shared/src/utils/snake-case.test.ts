import { describe, expect, it } from "vitest"
import { snakeCase } from "./snake-case"

describe("snakeCase", () => {
  it.each([
    ["courseVersions", "course_versions"],
    ["courses", "courses"],
    ["CourseVersions", "course_versions"],
    ["APIKey", "api_key"],
    ["HTTPServerError", "http_server_error"],
    ["kebab-case-name", "kebab_case_name"],
    ["dot.separated.name", "dot_separated_name"],
    ["colon:separated", "colon_separated"],
    ["  padded words  ", "padded_words"],
    ["already_snake_case", "already_snake_case"],
    ["version2Field", "version2_field"],
    ["", ""],
  ])("converts %j to %j", (input, expected) => {
    expect(snakeCase(input)).toBe(expected)
  })

  it("collapses runs of separators into a single underscore", () => {
    expect(snakeCase("a - b . c")).toBe("a_b_c")
  })
})
