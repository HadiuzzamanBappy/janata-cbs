# 🏛️ FinXUI Core Banking Workbench (v2)

A modern, highly optimized, and enterprise-ready Next.js application that serves as the dynamic frontend for the Java Core Banking system. 

This project is a complete refactor of the legacy FinXUI application, migrating from a monolithic, tightly-coupled React structure into a clean, **Domain-Driven Architecture**. It maintains powerful capabilities like dynamic schema-driven form rendering and bespoke workflows, but with strict security boundaries, efficient state management, and a robust component library.

## 🛠️ Architecture & Tech Stack

- **Framework**: [Next.js 16 App Router](https://nextjs.org/) (React 19)
- **Language**: [TypeScript](https://www.typescriptlang.org/) (Strict Mode)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) + OKLCH Design Tokens + [shadcn/ui](https://ui.shadcn.com/)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/) (Fast, un-opinionated state outside the React render tree)
- **RPC Transport**: `@grpc/grpc-js` & `ts-proto` (Server-only secure connection)
- **Session & Caching**: `ioredis` (Circuit-breaking, high-speed Redis client)
- **Data Boundary Validation**: [Zod](https://zod.dev/)

## ✨ Key Features

- **Dynamic Schema Engine**: The core UI is not hardcoded. The application dynamically fetches database form configurations (`GMC` payloads) from the Java backend over gRPC, validates them strictly with Zod, and renders them via a 12-column responsive layout engine.
- **Advanced Workspace Management**: Users can interact with the workbench either via browser popup windows (`window` mode) with smart instance reuse, or via an internal tabbed workspace (`panel` mode) where state is preserved instantly across tabs using Zustand.
- **Secure Server-Only Boundary**: The browser **never** communicates with gRPC directly. All core infrastructure modules (gRPC channels, Redis sessions, YAML parsing) are locked behind `import "server-only"` guards, ensuring secrets and heavy node modules never leak into the client bundle.
- **Zero-Flash Theming**: Implements a blocking script in `<head>` alongside OKLCH semantic color tokens (`--surface`, `--fg-muted`) to guarantee users never see a white flash on load when using dark mode.
- **Resilient Multi-Layer Caching**: Uses a robust read-through caching strategy (Browser memory → Redis → Core Java Backend). A fail-open circuit breaker ensures that if Redis goes down, requests fall straight through to the core without taking the UI offline.

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- [pnpm](https://pnpm.io/)
- A running instance of the Java Core Banking gRPC backend
- Redis (optional for development, required for production caching)

### Installation

```bash
# Install dependencies
pnpm install

# Run the development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Configuration (`.env.local`)

You will need to configure your environment variables. 
Key variables to understand:

```ini
# --- Workspace Mode ---
NEXT_PUBLIC_COMPONENT_TARGET=panel    # Render screens as tabs within the dashboard
# NEXT_PUBLIC_COMPONENT_TARGET=window # Render screens as external browser popups

# --- Data Source & Caching ---
MODEL_SOURCE=grpc             # 'grpc' for live backend, 'static' for offline mocks
CACHE_ENABLED=false           # Set to 'false' during development for fresh schemas
REDIS_URL=redis://127.0.0.1:6379
```
*Note: `NEXT_PUBLIC_` variables are inlined at build time. Changing them requires restarting the dev server.*

## 📁 Directory Structure (Domain-Driven)

```text
src/
├── app/               # Next.js App Router (RSC Hydration, API proxy routes, Session endpoints)
├── components/        # Reusable, Domain-Agnostic UI (shadcn primitives, app shell, toolbars)
├── features/          # Domain-Driven Business Logic
│   ├── engine/        # The dynamic form rendering engine
│   ├── auth/          # Login, password changes, user groups
│   ├── inquiries/     # Inquiry screens and tables (INQ, GIR, SIR)
│   ├── reporting/     # Report viewers and ReportStudio subsystem
│   ├── system-config/ # Screen builders, model configuration, menu design
│   └── workspace/     # Command executor, component loader, window frame
├── lib/               # Core Infrastructure & Tools
│   ├── core/          # 'server-only' gRPC, Redis, and Dispatcher tools
│   ├── schema/        # Zod payload validators and parsers
│   └── utils/         # Client-safe shared utilities
└── store/             # Zustand Global Stores (Tabs, Alerts, Session)
```

## 🧠 Architectural Rules (Do Not Break)

To maintain the integrity of this refactor, all code must adhere to the following strict guidelines:
1. **No Monoliths**: Files must not exceed 300 lines (for components) or 200 lines (for utilities).
2. **Zero `any` Types**: TypeScript strict mode is enforced. Unknown data must be typed or validated via Zod.
3. **No Direct Client gRPC**: Components must only `fetch()` to `/api/proxy` or use Server Actions. 
4. **Single Unified Loader**: All dynamic component loading must route through the single `ComponentLoader` (replacing the legacy triple-loader pattern).
