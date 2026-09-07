export function snakeCase(value: string): string {
  return value
    .replace(/([a-z\d])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .replace(/[-.:\s_]+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/\s/g, "_")
}
