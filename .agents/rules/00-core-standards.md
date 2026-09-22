# 00: Core Code Standards & Pitfalls

- **TypeScript Strictness**: NEVER use `any`, `@ts-ignore`, or non-null assertions (`!`). If a type is unknown, use `unknown` and validate it.
- **Server/Client Leakage**: NEVER import files from `src/lib/core/` (which are `server-only`) into files marked with `"use client"`.
- **Zustand Hydration Safety**: Zustand stores MUST ONLY be imported and accessed inside `"use client"` components to prevent server-side memory leaks across requests.
- **React Hook Exhaustiveness**: Every `useEffect`, `useMemo`, and `useCallback` MUST include all referenced variables in its dependency array. Do not suppress ESLint exhaustive-deps warnings.
- **Zod Boundary Trust**: NEVER trust raw `req.json()` or external API responses. All incoming data MUST pass through a `.parse()` or `.safeParse()` Zod schema before hitting business logic.
- **Safe Server Actions**: Server Actions MUST catch errors internally and return typed `{ error: string }` objects. Do NOT throw raw unhandled exceptions to the client.
- **Base UI Type Preservation**: Use Base UI's `render={<Component />}` pattern for triggers (e.g., `DropdownMenuTrigger`) instead of `asChild` to preserve exact TypeScript signatures.
- **Future Work Labeling**: When writing code that contains stubs, mock integrations, or placeholders for future work, you MUST explicitly label it using a `// TODO:` comment so it can be easily tracked.
