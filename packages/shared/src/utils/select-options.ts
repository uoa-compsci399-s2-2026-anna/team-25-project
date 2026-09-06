/**
 * Turns an enum labels map into the { label, value }[] shape Payload select
 * fields expect, so the options and the enum can never fall out of sync.
 */
export const toSelectOptions = <T extends string>(
  labels: Record<T, string>,
): { label: string; value: T }[] =>
  (Object.entries(labels) as [T, string][]).map(([value, label]) => ({ label, value }))
