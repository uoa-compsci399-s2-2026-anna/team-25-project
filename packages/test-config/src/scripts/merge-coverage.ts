import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"

const ROOT = process.cwd()
const SOURCES = ["apps/frontend", "apps/backend", "packages/ui"]
const OUT_DIR = join(ROOT, "coverage")

function readJson(path: string): Record<string, unknown> {
  return JSON.parse(readFileSync(path, "utf-8"))
}

function mergeFinal(): Record<string, unknown> {
  const merged: Record<string, unknown> = {}
  for (const source of SOURCES) {
    const file = join(ROOT, source, "coverage", "coverage-final.json")
    if (!existsSync(file)) continue
    Object.assign(merged, readJson(file))
  }
  return merged
}

function mergeSummary(): Record<string, unknown> {
  const merged: Record<string, unknown> = {}
  for (const source of SOURCES) {
    const file = join(ROOT, source, "coverage", "coverage-summary.json")
    if (!existsSync(file)) continue
    for (const [key, value] of Object.entries(readJson(file))) {
      if (key === "total") continue
      merged[key] = value
    }
  }
  return merged
}

mkdirSync(OUT_DIR, { recursive: true })
writeFileSync(join(OUT_DIR, "coverage-final.json"), JSON.stringify(mergeFinal(), null, 2))
writeFileSync(join(OUT_DIR, "coverage-summary.json"), JSON.stringify(mergeSummary(), null, 2))
