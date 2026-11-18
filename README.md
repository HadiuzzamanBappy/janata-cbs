# 🏛️ Janata CBS Core Banking Workbench

> A modern, high-density, enterprise-grade Next.js core banking workbench serving as the dynamic frontend for the Java Core Banking system.

This project is built around a clean, **Domain-Driven Architecture (DDD)**. It features dynamic schema-driven form rendering (`GMC`), inquiries, full keyboard-first navigation, strict banking access control (`RIDASHL` & Four-Eyes verification), resilient Redis/offline caching, and a secure server-only gRPC proxy gateway.

---

## 🌍 Scope & Position in the Ecosystem

Janata Core Banking operates **strictly at the Presentation/Frontend Layer** of the Core Banking System.

### What it DOES:

- Provides a fast, interactive, high-density interface for tellers, branch officers, and administrators.
- Dynamically renders forms (`OpsForm`) and inquiry data views (`OpsInquiry`) from backend metadata specs.
- Enforces strict banking role permissions (`RIDASHL`) and Maker-Checker (Four-Eyes) validation in the UI.
- Maintains user session state and a multitab workbench (`panel` mode) or multi-window workstation (`window` mode) via Zustand.
- Translates client requests to backend gRPC payloads securely through Next.js server proxies.

### What it DOES NOT DO (Limitations):

- **No Direct Database Access:** Zero direct connections to the banking database. All state persistence flows through core backend services.
- **No Direct gRPC from Browser:** The client bundle NEVER imports or invokes gRPC channels directly; everything flows through the `/api/proxy` gateway.
- **No Core Financial Execution:** Complex banking ledger updates, interest calculations, and transaction settlement remain within the Java Core backend.

### System Flow

1. **Browser (Client):** User interacts with React 19 UI (Tailwind CSS v4, Base UI, shadcn/ui primitives).
2. **Next.js Server Gateway (BFF):** Validates client payloads via Zod, checks session tokens, interacts with Redis caching, and routes requests via `@grpc/grpc-js` (or mock fallback).
3. **Java Core Backend:** Receives gRPC payloads, executes banking logic, updates database ledgers, and responds.

---

## ✨ Key Features

- **Dynamic Schema Engine (`GMC`):** Forms are not hardcoded. Screen configurations are fetched dynamically, validated against Zod schemas, and rendered across a responsive 12-column high-density layout.
- **Banking Access Control (`RIDASHL`):** Comprehensive entitlement system controlling rights:
  - `R` (Reverse), `I` (Input/Maker), `D` (Delete), `A` (Authorize/Checker), `S` (See), `H` (Hold), `L` (List).
- **Four-Eyes Principle (Maker-Checker):** Built-in guard preventing the record inputter (`Maker`) from authorizing the same transaction (`Maker !== Checker`).
- **CBS Command Gateway & Fast Navigation:** Universal command input supporting banking shorthand (e.g., `ACCOUNT I 1001`, `USER,`, `INQ GET.EMP.INFO`, `SC.MENU.DESIGN`) with canonical alias resolution.
- **Unified Workbench & Multitask Tabs:** Preserves state across open tabs and supports split views and popup window instances via Zustand stores.
- **Server-Only Security Boundary:** Sensitive gRPC stubs, Redis connection details, and protobuf packages remain strictly server-side using `import "server-only"`.
- **Zero-Flash OKLCH Theming:** Dynamic brand accent switching and theme toggling using OKLCH semantic color tokens without layout or color flash on reload.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router, React 19)
- **Language**: [TypeScript](https://www.typescriptlang.org/) (Strict Mode)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) + OKLCH Design Tokens + [shadcn/ui](https://ui.shadcn.com/) / [@base-ui/react](https://base-ui.com/)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/) (Session, Workbench, Alerts)
- **RPC & Data Transport**: `@grpc/grpc-js`, `@grpc/proto-loader`, `@bufbuild/protobuf`
- **Validation**: [Zod](https://zod.dev/)
- **Caching & Sessions**: [ioredis](https://github.com/redis/ioredis) (with resilient fallback circuit breakers)
- **Code Quality**: [Biome](https://biomejs.dev/)

---

## 📁 Directory Structure (Domain-Driven)

Layers depend strictly downward (`app → features → components → hooks → store → lib → types`). The full annotated tree is in [docs/devs/PROJECT_TREE.md](docs/devs/PROJECT_TREE.md).

```text
mock/                      # Offline core simulator (@mock/core) & in-memory CBS tables (@mock/db), outside src/
proto/service.proto        # gRPC contract → pnpm proto:gen → src/lib/infra-grpc/generated/
scripts/                   # cache/, tools/ (proto-gen, fixture-normalize), verify/ (domain suites)
src/
├── app/                   # Next.js App Router: (auth), (workbench)/dashboard + screen/[id], (docs), api/
├── features/              # Screens: auth, docs, operations (OpsForm, OpsInquiry), system designers, workbench registry
├── components/            # cbs-command, cbs-form-engine, cbs-inquiry-engine, cbs-menu, cbs-screen, cbs-settings,
│                          # feedback, layout, ui (shadcn/Base UI primitives)
├── hooks/                 # Global hooks (idle timeout, single tab, container width, access)
├── store/                 # Zustand stores: alert, session, workbench (+ root-provider); theme provider
├── lib/                   # cbs-* domain libraries, core-* config/logger/utils, data-parsers, data-schemas,
│                          # infra-grpc & infra-redis ("server-only")
├── types/                 # Canonical contracts: access, protocol, screen, status
└── proxy.ts               # Next.js 16 request proxy (session guard & redirects)
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v20+)
- [pnpm](https://pnpm.io/)
- A running Java Core Banking backend, or the offline simulator (`DATA_SOURCE=static`)
- Redis (optional locally; in production it holds sessions and the spec cache, and login rate limiting only works while Redis is up)

### Installation & Execution

```bash
# Install dependencies
pnpm install

# Configure: offline = DATA_SOURCE=static + CACHE_ENABLED=false; live = DATA_SOURCE=grpc + GRPC_HOST + REDIS_URL
cp .env.example .env.local

# Run the development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 🧪 Verification & Test Suites

The project includes specialized verification scripts ensuring that all banking rules, access boundaries, and wire contracts remain intact:

```bash
pnpm verify:all         # Runs the 16 offline suites (includes verify:layers)
pnpm verify:access      # Run a single suite; the full list is in AGENTS.md §2
pnpm verify:api         # Live core + running dev server required (not part of verify:all)
```

The complete list of suites, one per library, is in [AGENTS.md §2](AGENTS.md#2-commands).

---

## 🧠 Architectural Rules

1. **High-Density Compact Sizing:** Banking operators require maximum screen real estate. Use compact control heights (`h-8`), `text-xs` typography for tables and labels, and 12-column grid structures.
2. **Strict Server Boundary:** Never import `@grpc/grpc-js`, Redis, or server credentials in client components. Access backend services only via the `/api/proxy` route or Server Actions.
3. **Four-Eyes Enforcement:** Always apply Four-Eyes checks on authorization actions (`Maker !== Checker`).
4. **Unified Screen Loader:** Dynamic screens must resolve through `resolveScreen()` in `src/features/workbench/registry.tsx` rather than hardcoded ad-hoc component switches.
5. **Type Safety & No `any`:** All external wire payloads must pass through Zod schemas or typed data parsers before consumption.
