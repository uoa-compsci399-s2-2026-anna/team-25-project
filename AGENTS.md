<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

## cacheComponents

`apps/frontend/next.config.ts` has `cacheComponents: true`. Every component tree is static by default — `fetch()`, `cookies()`, `headers()`, `searchParams`, and dynamic `params` all throw a build error unless the read is wrapped in `<Suspense>` (makes that subtree dynamic) or the function has `"use cache"` on it. Same applies to Route Handlers using `cookies()`/`headers()`.

<!-- END:nextjs-agent-rules -->
