# 🚀 Future Architecture Upgrades & Technical Debt Log

> **Purpose:** This document logs the architectural gaps and future upgrade paths for the `finxui-ref` enterprise application. 
> 
> **Do NOT implement these during the Phase 1 Refactor.** These are intended for Phase 2, once the old `finxui` codebase has been completely migrated and deleted. These upgrades are specifically tailored to the unique dependencies, banking functionality, and dynamic nature of FinXUI.

---

## 1. Dynamic Form Engine: Form Library Integration
**Current State:** 
The dynamic schema engine (`SC.DYNAMIC.tsx`) relies on a custom `use-form-state.ts` reducer to track user input across dynamically generated fields.

**The Future Upgrade (Phase 2):**
Maintaining a custom form state engine is complex and prone to performance issues (re-renders). 
- **Dependency to add:** `react-hook-form` paired with `@hookform/resolvers/zod`.
- **Why:** `react-hook-form` is the industry standard for performant forms. It supports dynamic `useFieldArray` and isolated field re-renders. By feeding your backend `GMC` schemas into a dynamic `react-hook-form`, you eliminate custom state-tracking bugs, gain built-in dirty/touched states, and massively improve typing performance on large banking forms.

---

## 2. gRPC Infrastructure: Modern Connect-RPC
**Current State:** 
The project uses raw `@grpc/grpc-js` and `ts-proto` hidden behind a `server-only` boundary. This is secure but highly boilerplate-heavy.

**The Future Upgrade (Phase 2):**
- **Dependency to evaluate:** `Connect-ES` (by Buf) or `Connect-Node`.
- **Why:** Raw `grpc-js` is heavy and tightly coupled to Node.js internals. `Connect` is a modern, TypeScript-first, web-compatible RPC protocol. It allows you to ditch the custom `dispatch.ts` middleware and interact with your Java backend using much cleaner, standard `fetch`-based HTTP/2 clients while retaining 100% Protocol Buffer type safety.

---

## 3. Caching: Native Next.js Data Cache Integration
**Current State:** 
Caching is handled by a custom `getOrSet()` wrapper around `ioredis`, with a custom `/api/cache` endpoint for invalidation.

**The Future Upgrade (Phase 2):**
- **Why:** Next.js 14+ has a deeply integrated Data Cache and Next.js Cache Handler.
- **Path:** Instead of manually querying Redis in your components, you can configure Next.js to use Redis as its official caching backend. This allows you to use native Next.js features like `revalidateTag("ACCOUNT_SCHEMA")` or `revalidatePath("/dashboard")`. Next.js will automatically handle purging the Redis cache in the background, removing the need for your manual cache invalidation API routes.

---

## 4. Data Mutation: Server Actions vs. API Proxy
**Current State:** 
The application relies heavily on a centralized `/api/proxy/route.ts` as a generic gRPC forwarder.

**The Future Upgrade (Phase 2):**
- **Why:** Next.js App Router heavily pushes **Server Actions** for data mutations (creates, updates, deletes) rather than manual `fetch()` calls to API routes.
- **Path:** Colocate `actions.ts` files inside feature folders (e.g., `src/features/auth/actions.ts`). These server actions will still securely call your internal `grpc.ts` client, but they bypass the need for an HTTP API route middleman and integrate natively with React's `useTransition` and `<form action={...}>`.

---

## 5. Workspace Tabs: URL State Syncing
**Current State:** 
The multi-instance banking workbench uses `Zustand` to track open tabs (e.g., Tab 1: GIR, Tab 2: SIR) entirely in client memory.

**The Future Upgrade (Phase 2):**
- **Dependency to add:** `nuqs` (Type-safe URL search params for Next.js).
- **Why:** In a professional enterprise app, users expect to be able to refresh the page or share a link to a specific tab. Because your tabs only live in Zustand memory, a page refresh destroys the workspace.
- **Path:** Sync your active tab instance IDs to the URL (`?tab=instance_123`). This allows users to bookmark specific workspaces, and ensures the Next.js router is always aware of the user's active context.

---

## 6. Total Deprecation of YAML
**Current State:** 
The architecture still references `config.yml` and a YAML service resolver.

**The Future Upgrade (Phase 2):**
- **Why:** Next.js natively supports rich environment variable resolution (`.env`, `.env.local`) which is automatically injected at build time. Loading and parsing YAML adds unnecessary Node dependencies (`js-yaml`) and runtime overhead.
- **Path:** Move all service resolutions into standard environment variables or a strictly typed `src/config/index.ts` file.
