# 🚀 Quickstart & Local Setup Guide

## 1. Executive Summary & Purpose
This document provides local setup, environment configuration, dependency installation, and script execution instructions for developers onboarding onto the Janata CBS Core Banking Workbench (`finx-ui`).

---

## 2. Environment Prerequisites

- **Node.js:** v18.0.0 or higher
- **Package Manager:** `pnpm` (v8+)
- **Redis (Optional for Dev):** Local Redis server running on `redis://127.0.0.1:6379` (Required if `CACHE_ENABLED=true`).
- **Java Core Backend (Optional for Offline Mocks):** A running instance of Java SE Core gRPC engine or offline static mock mode (`MODEL_SOURCE=static`).

---

## 3. Step-by-Step Local Setup

### Step 1: Clone & Install Dependencies
```bash
# Clone project repository
git clone <repository-url>
cd finx-ui

# Install locked dependency tree
pnpm install
```

### Step 2: Environment Configuration (`.env.local`)
Create a `.env.local` file in the root workspace directory based on `.env.example`:

```ini
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXT_PUBLIC_LOGOUT_TIME=10            # Session logout window in minutes

# --- Data Source & Caching ---
MODEL_SOURCE=grpc                     # Set to 'static' for offline mock development without gRPC
CACHE_ENABLED=false                   # Set to 'false' during development for instant schema reloads
REDIS_URL=redis://127.0.0.1:6379
```

### Step 3: Launch Local Development Server
```bash
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 4. Operational Scripts Reference

| Command | Action |
| :--- | :--- |
| `pnpm dev` | Starts Next.js development server with hot module reloading. |
| `pnpm build` | Executes standalone production build validation. |
| `pnpm start` | Runs built production server bundle. |
| `pnpm lint` | Runs Biome linter and formatting checks. |
| `pnpm typecheck` | Executes TypeScript strict type checks (`tsc --noEmit`). |

---

## 5. Architectural Rules (MUST / MUST NOT)

### Mandatory Rules (MUST)
- **MUST** use `pnpm` exclusively as package manager to maintain deterministic lockfiles (`pnpm-lock.yaml`).
- **MUST** run `pnpm typecheck` and `pnpm lint` before pushing branch commits.
- **MUST NOT** commit `.env` or `.env.local` containing live production Redis connection strings or secrets to git.

---

## 6. Verification Criteria

To verify local setup:
```bash
pnpm typecheck
pnpm lint
pnpm build
```

---

## 7. Affected Documentation Updates
When modifying setup instructions or dev scripts, update:
- [docs/05-developer-guides/quickstart-setup.md](file:///d:/Work/React/cbs/finx-ui/docs/05-developer-guides/quickstart-setup.md)
- [README.md](file:///d:/Work/React/cbs/finx-ui/README.md)
