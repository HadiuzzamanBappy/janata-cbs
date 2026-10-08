import {
  BookOpen,
  Code,
  Cpu,
  DollarSign,
  FileCheck,
  FolderKanban,
  HelpCircle,
  Network,
  Shield,
} from "lucide-react";
import type { NavGroup } from "./types";

export const DEV_NAV_GROUPS: NavGroup[] = [
  {
    id: "01-architecture",
    title: "01. Architecture & Governance",
    icon: Shield,
    items: [
      {
        label: "Overview & Topology",
        href: "/devs/01-architecture/overview",
        keywords: ["topology", "bff", "3-tier", "grpc", "architecture", "boundaries"],
      },
      {
        label: "Folder Structure & DDD",
        href: "/devs/01-architecture/folder-structure",
        keywords: ["folder", "structure", "ddd", "bulletproof", "barrel", "colocation"],
      },
      {
        label: "Security & Secrets",
        href: "/devs/01-architecture/security-and-secrets",
        keywords: ["security", "secrets", "server-only", "session", "auth", "isolation"],
      },
      {
        label: "Code Review Standards",
        href: "/devs/01-architecture/code-review-standards",
        keywords: ["review", "standards", "quality", "audit", "checklist", "pr"],
      },
    ],
  },
  {
    id: "02-core-engine",
    title: "02. Core Dynamic Engine",
    icon: Cpu,
    items: [
      {
        label: "GMC Payload Specification",
        href: "/devs/02-core-engine/gmc-schema-spec",
        keywords: ["gmc", "schema", "spec", "payload", "validation", "grid"],
      },
      {
        label: "Form Rendering Pipeline",
        href: "/devs/02-core-engine/form-rendering-pipeline",
        keywords: ["pipeline", "form", "renderer", "dynamic", "controls", "fields"],
      },
      {
        label: "Component Loader & Pop-outs",
        href: "/devs/02-core-engine/component-loader",
        keywords: ["loader", "component", "pop-out", "override", "bespoke", "window"],
      },
    ],
  },
  {
    id: "03-domain-features",
    title: "03. Business Domain Features",
    icon: FolderKanban,
    items: [
      {
        label: "Auth & Session Domain",
        href: "/devs/03-domain-features/auth-and-session",
        keywords: ["auth", "session", "login", "password", "redis", "token"],
      },
      {
        label: "Workspace & Windows Domain",
        href: "/devs/03-domain-features/workspace-and-windows",
        keywords: ["workspace", "windows", "tabs", "command", "docking", "store"],
      },
      {
        label: "Inquiries Engine",
        href: "/devs/03-domain-features/inquiries",
        keywords: ["inquiries", "inquiry", "tables", "grid", "inq", "gir", "sir", "search"],
      },
      {
        label: "Reporting Studio & Viewer",
        href: "/devs/03-domain-features/reporting-studio",
        keywords: ["reporting", "studio", "viewer", "reports", "designer", "ledger"],
      },
      {
        label: "System Configuration Tools",
        href: "/devs/03-domain-features/system-config",
        keywords: ["system", "config", "builder", "model", "admin", "menu"],
      },
    ],
  },
  {
    id: "04-data-flow-and-api",
    title: "04. Data Flow & API Transport",
    icon: Network,
    items: [
      {
        label: "gRPC & BFF Proxy Gateway",
        href: "/devs/04-data-flow-and-api/grpc-and-bff-proxy",
        keywords: ["grpc", "bff", "proxy", "envelope", "dispatch", "gateway"],
      },
      {
        label: "Dynamic API Architecture",
        href: "/devs/04-data-flow-and-api/dynamic-api-integration",
        keywords: ["api", "dynamic", "records", "generic", "integration"],
      },
      {
        label: "Multi-Layer Caching & Breaker",
        href: "/devs/04-data-flow-and-api/caching-strategy",
        keywords: ["caching", "redis", "circuit-breaker", "memory", "performance"],
      },
      {
        label: "Error Handling & Alerts",
        href: "/devs/04-data-flow-and-api/error-handling-and-alerts",
        keywords: ["error", "handling", "alerts", "boundaries", "sanitizer"],
      },
    ],
  },
  {
    id: "05-developer-guides",
    title: "05. Operational Runbooks",
    icon: Code,
    items: [
      {
        label: "Quickstart & Local Setup",
        href: "/devs/05-developer-guides/quickstart-setup",
        keywords: ["quickstart", "setup", "install", "environment", "run"],
      },
      {
        label: "Scaffold New Domain Feature",
        href: "/devs/05-developer-guides/adding-new-domain-feature",
        keywords: ["scaffold", "feature", "domain", "module", "generator", "runbook"],
      },
      {
        label: "Offline Static Mock Mode",
        href: "/devs/05-developer-guides/static-mock-mode",
        keywords: ["mock", "offline", "fixtures", "static", "specs"],
      },
      {
        label: "Extending Doc Portal & Modules",
        href: "/devs/05-developer-guides/extending-doc-portal-or-module",
        keywords: ["docs", "portal", "markdown", "extending", "module"],
      },
      {
        label: "Git Workflow & Commit Rules",
        href: "/devs/05-developer-guides/git-workflow-and-commits",
        keywords: ["git", "workflow", "commit", "conventional", "husky"],
      },
    ],
  },
];

export const MANUAL_NAV_GROUPS: NavGroup[] = [
  {
    id: "01-getting-started",
    title: "01. Getting Started",
    icon: BookOpen,
    items: [
      {
        label: "Officer Login & Password Reset",
        href: "/manual/01-getting-started/officer-login",
        keywords: ["login", "session", "auth", "credentials", "security", "password"],
      },
      {
        label: "Workspace & Navigation Guide",
        href: "/manual/01-getting-started/workspace-navigation",
        keywords: ["workspace", "tabs", "navigation", "dashboard", "menu", "windows"],
      },
    ],
  },
  {
    id: "02-daily-teller-operations",
    title: "02. Daily Teller Operations",
    icon: DollarSign,
    items: [
      {
        label: "Customer & Account Inquiries",
        href: "/manual/02-daily-teller-operations/customer-inquiry",
        keywords: ["customer", "inquiry", "search", "account", "balance", "profile"],
      },
      {
        label: "Transaction Entry & Drafts",
        href: "/manual/02-daily-teller-operations/transaction-entry",
        keywords: ["deposit", "withdrawal", "transfer", "transaction", "cash", "draft"],
      },
      {
        label: "Maker-Checker Authorization",
        href: "/manual/02-daily-teller-operations/maker-checker-authorization",
        keywords: ["maker", "checker", "override", "approval", "workflow", "4-eye"],
      },
    ],
  },
  {
    id: "03-reports-and-end-of-day",
    title: "03. Reports & End of Day",
    icon: FileCheck,
    items: [
      {
        label: "Generating & Printing Reports",
        href: "/manual/03-reports-and-end-of-day/printing-daily-reports",
        keywords: ["reports", "ledger", "balance", "audit", "daily", "print", "journal"],
      },
      {
        label: "Close of Business (COB) Guide",
        href: "/manual/03-reports-and-end-of-day/cob-process-overview",
        keywords: ["cob", "close", "checklist", "reconcile", "cutoff", "eod", "batch"],
      },
    ],
  },
  {
    id: "04-troubleshooting",
    title: "04. Troubleshooting & FAQs",
    icon: HelpCircle,
    items: [
      {
        label: "Common Errors & FAQs",
        href: "/manual/04-troubleshooting/error-messages-faq",
        keywords: ["error", "solution", "troubleshooting", "network", "lock", "faq", "alerts"],
      },
    ],
  },
];
