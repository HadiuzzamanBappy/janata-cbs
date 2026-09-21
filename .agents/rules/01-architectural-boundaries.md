# 01: Architectural Boundaries & Security

- **BFF Strictness**: The browser MUST NEVER communicate directly with the Java Core backend or a database. All client calls MUST route through a Next.js Server Action or `/api/proxy`.
- **Server-Only Leak Prevention**: Every file inside `src/lib/core/` (gRPC channels, Redis clients, Dispatchers) MUST begin with `import "server-only";` to prevent fatal client bundler crashes.
- **Client gRPC Ban**: NEVER import `@grpc/grpc-js` or `ts-proto` generated stubs into any file marked with `"use client"`.
- **The Validation Boundary**: NEVER pass raw client JSON payloads directly to the gRPC dispatcher. All data crossing from the client to the server MUST be validated via Zod schemas (`src/lib/schema/`) first.
- **Env Variable Security**: NEVER expose server secrets (Redis URLs, internal API keys) to the browser. Only use the `NEXT_PUBLIC_` prefix for purely safe client-side configurations.
