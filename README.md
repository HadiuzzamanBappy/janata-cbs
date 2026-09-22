# 🏛️ FinXUI Core Banking Workbench (v2)

> A modern, highly optimized, and enterprise-ready Next.js application serving as the dynamic frontend for the Java Core Banking system.

This project is a complete refactor of the legacy FinXUI application. It migrates away from a monolithic, tightly-coupled React structure into a clean, **Domain-Driven Architecture**. It maintains powerful capabilities like dynamic schema-driven form rendering and bespoke workflows, but with strict security boundaries, efficient state management, and a robust component library.

---

## 🌍 Scope & Position in the Ecosystem

FinXUI operates **strictly at the Presentation/Frontend Layer** of the Core Banking System. 

### What it DOES:
- Provides a fast, interactive user interface for banking officers and administrators.
- Dynamically renders forms and workspaces based on backend configurations.
- Maintains user session state and UI state (tabs, dialogs, themes) securely.

### What it DOES NOT DO (Limitations):
- **No Direct Database Access:** This application has zero direct connection to the underlying banking database. All data persists via the core backend.
- **No Direct gRPC from Browser:** The browser client NEVER talks to the gRPC backend directly. It must go through the Next.js API/Server Action boundary.
- **No Business Logic Execution:** Complex banking calculations, ledger updates, and transactional logic are handled by the Java Core. FinXUI only handles UI validation and presentation logic.

### System Flow
1. **Browser (Client):** User interacts with the React UI (Tailwind, shadcn/ui).
2. **Next.js Server (BFF - Backend for Frontend):** Acts as a secure proxy. Validates client payloads via Zod, manages Redis sessions, and translates REST/Actions to gRPC.
3. **Java Core Backend:** Receives gRPC requests, executes banking logic, and queries the database.

---

## ✨ Key Features

- **Dynamic Schema Engine:** The core UI is not hardcoded. The application dynamically fetches database form configurations (`GMC` payloads) from the Java backend over gRPC, validates them strictly with Zod, and renders them via a 12-column responsive layout engine.
- **Advanced Workspace Management:** Users can interact with the workbench either via browser popup windows (`window` mode) with smart instance reuse, or via an internal tabbed workspace (`panel` mode) where state is preserved instantly across tabs using Zustand.
- **Secure Server-Only Boundary:** All core infrastructure modules (gRPC channels, Redis sessions, Zod schema validation) are locked behind `import "server-only"` guards, ensuring secrets and heavy node modules never leak into the client bundle.
- **Zero-Flash Theming:** Implements a blocking script in `<head>` alongside OKLCH semantic color tokens (`--surface`, `--fg-muted`) to guarantee users never see a white flash on load when using dark mode.
- **Resilient Multi-Layer Caching:** Uses a robust read-through caching strategy (Browser memory → Redis → Core Java Backend). A fail-open circuit breaker ensures that if Redis goes down, requests fall straight through to the core without taking the UI offline.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16 App Router](https://nextjs.org/) (React 19)
- **Language**: [TypeScript](https://www.typescriptlang.org/) (Strict Mode)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) + OKLCH Design Tokens + [shadcn/ui](https://ui.shadcn.com/)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/) (Fast, un-opinionated state outside the React tree)
- **RPC Transport**: `@grpc/grpc-js` & `ts-proto` (Server-only secure connection)
- **Session & Caching**: `ioredis` (Circuit-breaking, high-speed Redis client)
- **Validation Boundary**: [Zod](https://zod.dev/)

---

## 📁 Directory Structure (Domain-Driven)

```text
src/
├── app/               # Next.js App Router (RSC Hydration, API proxy routes, Session endpoints)
├── components/        # Reusable, Domain-Agnostic UI (shadcn primitives, app shell, toolbars)
├── features/          # Domain-Driven Business Logic (Where most development happens)
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

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- [pnpm](https://pnpm.io/)
- A running instance of the Java Core Banking gRPC backend
- Redis (optional for development, required for production caching)

### Installation & Execution

```bash
# Install dependencies
pnpm install

# Run the development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Configuration (`.env.local`)

You will need to configure your environment variables. Key variables to understand:

```ini
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXT_PUBLIC_LOGOUT_TIME=10            # In minutes

# --- Data Source & Caching ---
MODEL_SOURCE=grpc             # 'grpc' for live backend, 'static' for offline mocks
CACHE_ENABLED=false           # Set to 'false' during development for fresh schemas
REDIS_URL=redis://127.0.0.1:6379
```
*Note: `NEXT_PUBLIC_` variables are inlined at build time. Changing them requires restarting the dev server.*

---

## 🧠 Architectural Rules (Do Not Break)

To maintain the integrity of this refactor, all developers must adhere to the following strict guidelines:

1. **No Monoliths:** Files must not exceed 300 lines (for components) or 200 lines (for utilities). Break complex logic down into smaller, testable modules.
2. **Zero `any` Types:** TypeScript strict mode is enforced. Unknown data crossing boundaries must be typed or validated via Zod.
3. **No Direct Client gRPC:** Components must only `fetch()` to `/api/proxy` or use Server Actions. The Next.js server handles the actual gRPC connection to the Java backend.
4. **Single Unified Loader:** All dynamic component loading must route through the single `ComponentLoader` defined in the workspace feature (replacing the legacy triple-loader pattern).
5. **Data Flow Protocol:** If you need to send data from the UI to the backend:
   - Construct the payload in the UI.
   - Send it via standard HTTP to a Next.js Route Handler (`src/app/api/...`) or a Server Action.
   - Parse and validate the payload using a Zod schema in `src/lib/schema/`.
   - Forward the clean, validated payload to the Java backend via gRPC from the server context.
