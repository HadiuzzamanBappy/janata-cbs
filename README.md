# 🏛️ Janata CBS Core Banking Workbench

> A modern, high-density, enterprise-grade Next.js core banking workbench serving as the dynamic frontend for the Java Core Banking system.

This project is built around a clean, **Domain-Driven Architecture (DDD)**. It features dynamic schema-driven form rendering (`GMC`), inquiries, full keyboard-first navigation, strict banking access control (`RIDASHL` & Four-Eyes verification), resilient Redis/offline caching, and a secure server-only gRPC proxy gateway.

---

## 🌍 Scope & Position in the Ecosystem

Janata Core Banking operates **strictly at the Presentation/Frontend Layer** of the Core Banking System. 

### What it DOES:
- Provides a fast, interactive, high-density interface for tellers, branch officers, and administrators.
- Dynamically renders forms (`FormScreen`) and inquiry data views (`InquiryScreen`) from backend metadata specs.
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
- **RPC & Data Transport**: `@grpc/grpc-js`, `@bufbuild/protobuf`, `ts-proto`
- **Validation**: [Zod](https://zod.dev/)
- **Caching & Sessions**: [ioredis](https://github.com/redis/ioredis) (with resilient fallback circuit breakers)
- **Code Quality**: [Biome](https://biomejs.dev/)

---

## 📁 Directory Structure (Domain-Driven)

```text
src/
├── app/                  # Next.js App Router
│   ├── (auth)/           # Authentication route group (Login, lock screen)
│   ├── (workbench)/      # Core banking workbench (screen/[id], multi-tab layout)
│   ├── [docs]/           # In-app operator & technical documentation portal
│   ├── api/              # API routes & gRPC proxy endpoints (/api/proxy)
│   ├── globals.css       # Tailwind v4 semantic design tokens (OKLCH)
│   └── layout.tsx        # Root HTML layout with providers
│
├── components/           # Reusable UI & CBS presentation elements
│   ├── ui/               # Atomic shadcn/ui and Base UI primitives
│   ├── layout/           # Global shell components (Workbench header, sidebar, topbar)
│   ├── cbs-access/       # Permission badges, function right indicators, guards
│   ├── cbs-screen/       # High-density form cards, action headers, command wrappers
│   └── feedback/         # Modals, confirmation dialogs, toast notifications
│
├── features/             # Domain-Driven Modules
│   ├── auth/             # Authentication & session controls
│   ├── command/          # CBS Command Gateway bar & fast action executor
│   ├── operations/       # Core business screens
│   │   ├── forms/        # 12-column dynamic GMC form engine & field controls
│   │   └── inquiries/    # Enquiry queries, data filters, and high-density tables
│   ├── workbench/        # Multitab layout, unified screen loader, and component registry
│   ├── system/           # Bespoke admin tools (Menu Catalog, Menu Designer, Model Config, User Groups)
│   ├── settings/         # User preferences and workstation hotkeys
│   └── docs/             # Technical docs viewer
│
├── lib/                  # CBS Infrastructure, Clients & Utilities
│   ├── cbs-access/       # RIDASHL permission engine & Four-Eyes verification
│   ├── cbs-command/      # Command parser, grammar evaluator, and alias registry
│   ├── cbs-client/       # Front-end API client interfacing with /api/proxy
│   ├── cbs-hotkeys/      # Banking keyboard shortcut listener engine (F-keys, Esc, Enter)
│   ├── cbs-record/       # CBS record status machines (INA, AU, Hold, Reverse, Delete)
│   ├── cbs-screen/       # Screen metadata configuration & permission mapping
│   ├── core-config/      # Validated environment configurations
│   ├── core-logger/      # Structured application logger
│   ├── core-utils/       # Banking formatters (BDT currency, account masking, dates)
│   ├── data-parsers/     # Wire payload and stream parsers
│   ├── data-schemas/     # Zod schemas for request/response payloads
│   ├── infra-grpc/       # Server-only gRPC client, credentials, and dispatcher
│   ├── infra-redis/      # Redis connection pool and caching circuit-breaker
│   └── infra-services/   # Service layers & offline fallback mock generators
│
├── store/                # Zustand Global Stores (Workbench, Session, Alerts)
├── types/                # Global TypeScript definitions & banking types
└── proxy.ts              # gRPC proxy core handler
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v20+)
- [pnpm](https://pnpm.io/)
- A running Java Core Banking backend (or enable static mock fallback)
- Redis (optional for local dev, recommended for production caching)

### Installation & Execution

```bash
# Install dependencies
pnpm install

# Run the development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 🧪 Verification & Test Suites

The project includes specialized verification scripts ensuring that all banking rules, access boundaries, and wire contracts remain intact:

```bash
# Run all verifications
pnpm verify:all

# Specific test suites:
pnpm verify:access      # Tests RIDASHL rights, Four-Eyes principle, and role clearance
pnpm verify:command     # Tests CBS command gateway syntax, aliases, and RBAC execution
pnpm verify:client      # Tests wire request factories (GET, PUT, AUT, INQ, GRL)
pnpm verify:record      # Tests CBS record status transitions (INA, AU, Hold, Reverse)
pnpm verify:matrix      # Tests environment matrix, mock fixtures, and wire parsers
pnpm verify:utils       # Tests currency formatting (BDT), account masks, and value dates
pnpm verify:services    # Tests infrastructure services and mock fallback handlers
```

---

## 🧠 Architectural Rules

1. **High-Density Compact Sizing:** Banking operators require maximum screen real estate. Use compact control heights (`h-9`), `text-xs` typography for tables and labels, and 12-column grid structures.
2. **Strict Server Boundary:** Never import `@grpc/grpc-js`, Redis, or server credentials in client components. Access backend services only via the `/api/proxy` route or Server Actions.
3. **Four-Eyes Enforcement:** Always apply Four-Eyes checks on authorization actions (`Maker !== Checker`).
4. **Unified Screen Loader:** Dynamic screens must resolve through `resolveScreen()` in [src/features/workbench/registry.tsx](file:///d:/CBS/In_house/finx/janata-cbs/src/features/workbench/registry.tsx) rather than hardcoded ad-hoc component switches.
5. **Type Safety & No `any`:** All external wire payloads must pass through Zod schemas or typed data parsers before consumption.
