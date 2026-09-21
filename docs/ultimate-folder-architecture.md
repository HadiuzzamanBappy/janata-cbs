# Ultimate Enterprise Next.js BFF Architecture

This document defines the rigid, unbiased, military-grade folder architecture for the `finxui-ref` project. It adheres to the official Next.js App Router best practices and the industry-standard "Bulletproof React" (Feature-Sliced) Domain-Driven Design (DDD) pattern.

This structure is mandatory. It ensures infinite scalability, absolute security for backend secrets, and clean separation of concerns.

---

## The Master Architecture Tree

```text
src/
├── app/                        # 1. THE ROUTING LAYER
│   ├── (auth)/                 # Route Groups (logical grouping, bypasses main layout)
│   │   └── login/page.tsx
│   ├── (dashboard)/            # Main app workspace
│   │   ├── layout.tsx          # Global providers and shell (sidebar/header)
│   │   └── page.tsx            
│   └── api/                    # 2. THE API GATEWAY (BFF Endpoints)
│       ├── auth/[...nextauth]/ # Auth handlers (NextAuth/Auth.js)
│       └── proxy/              # Secure passthrough for legacy/complex backend calls
│
├── features/                   # 3. THE DOMAIN LAYER (Strict Colocation)
│   │   # Every business domain gets its own isolated mini-app
│   ├── inquiries/              
│   │   ├── components/         # UI specific only to inquiries
│   │   ├── actions/            # Next.js Server Actions (Mutations)
│   │   ├── hooks/              # Client state for this feature
│   │   ├── schemas/            # Zod validation (Data dictionary)
│   │   └── types/              # TypeScript interfaces
│   └── reporting/
│
├── components/                 # 4. THE GLOBAL UI LAYER
│   ├── ui/                     # Pure, dumb components (shadcn: buttons, dialogs, inputs)
│   ├── layout/                 # Structural pieces (Sidebar, Navbar, Footer)
│   └── providers/              # Global React Contexts (ThemeProvider, QueryClient)
│
├── lib/                        # 5. THE INFRASTRUCTURE LAYER
│   ├── bff/                    # Backend connections (STRICTLY SERVER-ONLY)
│   │   ├── grpc-client.ts      # Singleton connection to Java
│   │   ├── redis-client.ts     # Caching layer
│   │   └── fetcher.ts          # Internal REST client with circuit breakers
│   ├── utils/                  # Pure, stateless helper functions
│   │   ├── formatters.ts       # Currency/Date formatters
│   │   └── cn.ts               # Tailwind class merger
│   └── constants/              # System-wide static variables (Enums, Configs)
│
├── hooks/                      # 6. GLOBAL CLIENT HOOKS
│   ├── use-media-query.ts      # Reusable UI hooks
│   └── use-local-storage.ts
│
├── store/                      # 7. GLOBAL STATE (Zustand/Redux)
│   └── use-workspace-store.ts  # Only for state that crosses multiple features (e.g. active tabs)
│
└── types/                      # 8. GLOBAL TYPES
    └── global.d.ts             # Environment variable typing and global overrides
```

---

## Architectural Rules & Enforcements

### 1. Colocation (The `features/` pattern)
**Rule:** Business logic MUST NOT be placed in global folders (`src/components`, `src/hooks`). 
Everything related to a specific business capability must reside in its respective `src/features/<name>/` folder. A feature folder acts as an isolated ecosystem containing its own `components`, `actions`, `hooks`, and `schemas`. If a feature is deleted, its entire ecosystem is removed cleanly without leaving dead code.

### 2. The Thin `app/` Directory
**Rule:** The `src/app/` directory is strictly for URL routing and API gateways.
Files in `src/app/` should contain minimal logic. They exist solely to define routes, import layouts from `src/components/layout/`, and render content from `src/features/<name>/components/`. Do not write complex data fetching or UI logic directly inside `page.tsx`.

### 3. Isolated BFF Infrastructure (`lib/bff/`)
**Rule:** All backend connections (gRPC clients, Redis, database connections) MUST reside in `src/lib/bff/` (or `src/lib/core/`).
Next.js acts as a Backend-For-Frontend (BFF) connecting to a secure internal microservice ecosystem (Java/gRPC). Secrets and internal endpoints must never reach the browser. The entire infrastructure folder must be guarded by a single `import "server-only";` directive at the top of every file. This mathematically prevents accidental leaks to the client bundle.

### 4. Global vs. Local State
**Rule:** Local state stays in `features/`, global state stays in `store/`.
State specific to a single domain (like an open dropdown in a specific form) must be managed locally within that `features/` folder. Global state that crosses multiple domains (like which workspace tab is active or the current user session) goes into the `src/store/` folder. This prevents state managers like Zustand from becoming bloated dumping grounds.

### 5. Pure Global UI (`components/ui/`)
**Rule:** Global UI components MUST be domain-agnostic.
The `src/components/ui/` folder is reserved exclusively for dumb, reusable primitives (like Shadcn buttons, dialogs, and inputs). These components must never contain business logic, data fetching, or feature-specific terminology.
