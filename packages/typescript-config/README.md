# `@repo/typescript-config`

Shared `tsconfig.json` bases for the [Casa](../../README.md) monorepo.

## What's here

| File | Description |
| --- | --- |
| `base.json` | Base TypeScript compiler options shared by every workspace |
| `nextjs.json` | Extends `base.json` with Next.js-specific settings (used by `apps/web`) |
| `react-library.json` | Extends `base.json` for React component libraries (used by `packages/ui`) |

## Usage

Extend the relevant config in a workspace's `tsconfig.json`:

```json
{
  "extends": "@repo/typescript-config/nextjs.json"
}
```
