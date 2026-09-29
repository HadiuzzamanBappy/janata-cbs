import {
  BookOpen,
  Code,
  DollarSign,
  Folder,
  HelpCircle,
  PieChart,
  RefreshCw,
  Server,
  Shield,
  Terminal,
} from "lucide-react";
import type { NavGroup } from "./types";

export const DEV_NAV_GROUPS: NavGroup[] = [
  {
    id: "00-refactor",
    title: "00. Refactoring Progress",
    icon: RefreshCw,
    items: [
      {
        label: "Master Audit Plan",
        href: "/devs/00-refractor/refractor",
        keywords: ["refractor", "plan", "inventory", "syscomp", "migration"],
      },
      {
        label: "Refactoring Checklist",
        href: "/devs/00-refractor/refractor-checklist",
        keywords: ["checklist", "progress", "refactor", "status"],
      },
      {
        label: "Legacy Src Checklist",
        href: "/devs/00-refractor/legacy-src-checklist",
        keywords: ["legacy", "syscomp", "src", "checklist"],
      },
      {
        label: "Future Architecture Upgrades",
        href: "/devs/00-refractor/future-architecture-upgrades",
        keywords: ["future", "upgrades", "roadmap", "debt"],
      },
      {
        label: "AI Agent Development Guide",
        href: "/devs/00-refractor/agent-development-guide",
        keywords: ["agent", "ai", "guide", "antigravity", "skills"],
      },
    ],
  },
  {
    id: "01-architecture",
    title: "01. Architecture & Security",
    icon: Shield,
    items: [
      {
        label: "Overview & Topology",
        href: "/devs/01-architecture/overview",
        keywords: ["topology", "bff", "3-tier", "gRPC", "architecture"],
      },
      {
        label: "Authentication & RBAC",
        href: "/devs/01-architecture/auth-rbac",
        keywords: ["auth", "rbac", "jwt", "session", "security"],
      },
      {
        label: "Security & Guardrails",
        href: "/devs/01-architecture/security",
        keywords: ["headers", "cors", "rate limit", "audit", "security"],
      },
      {
        label: "Design Tokens & UI",
        href: "/devs/01-architecture/design-tokens",
        keywords: ["tokens", "radix", "tailwind", "theming", "colors"],
      },
    ],
  },
  {
    id: "02-bff-network",
    title: "02. BFF & Networking",
    icon: Server,
    items: [
      {
        label: "API Architecture",
        href: "/devs/02-bff-network/api-architecture",
        keywords: ["api", "rest", "proxy", "endpoints", "bff"],
      },
      {
        label: "gRPC & Protocol Buffers",
        href: "/devs/02-bff-network/grpc-proto",
        keywords: ["proto", "grpc", "protobuf", "streaming"],
      },
      {
        label: "Connection Lifecycle",
        href: "/devs/02-bff-network/connection-lifecycle",
        keywords: ["keepalive", "reconnect", "timeout", "circuit breaker"],
      },
      {
        label: "Error Handling & Codes",
        href: "/devs/02-bff-network/error-handling",
        keywords: ["error", "status", "codes", "exceptions"],
      },
    ],
  },
  {
    id: "03-screen-framework",
    title: "03. Screen Engine",
    icon: Terminal,
    items: [
      {
        label: "Screen Engine & Form Builder",
        href: "/devs/03-screen-framework/screen-framework",
        keywords: ["forms", "dynamic", "schema", "fields", "zod"],
      },
      {
        label: "Workspace & Tab Management",
        href: "/devs/03-screen-framework/workspace-tabs",
        keywords: ["tabs", "workspace", "docking", "state"],
      },
      {
        label: "Enquiry Engine & Grids",
        href: "/devs/03-screen-framework/enquiry-engine",
        keywords: ["enquiry", "tables", "pagination", "search", "filters"],
      },
    ],
  },
  {
    id: "04-domain-features",
    title: "04. Domain Features",
    icon: Folder,
    items: [
      {
        label: "Feature Architecture",
        href: "/devs/04-domain-features/feature-architecture",
        keywords: ["domains", "features", "structure", "ddd"],
      },
      {
        label: "Core Banking Workflows",
        href: "/devs/04-domain-features/banking-workflows",
        keywords: ["maker", "checker", "transactions", "teller", "gl"],
      },
    ],
  },
  {
    id: "05-guides-ops",
    title: "05. Guides & Operations",
    icon: Code,
    items: [
      {
        label: "Contributing Guidelines",
        href: "/devs/05-guides-ops/contributing",
        keywords: ["contribute", "git", "pr", "standards", "lint"],
      },
      {
        label: "Testing Strategy",
        href: "/devs/05-guides-ops/testing",
        keywords: ["vitest", "playwright", "unit", "e2e", "coverage"],
      },
      {
        label: "CI/CD & Deployment",
        href: "/devs/05-guides-ops/deployment",
        keywords: ["docker", "k8s", "cicd", "deploy", "pipeline"],
      },
      {
        label: "Observability & Logging",
        href: "/devs/05-guides-ops/observability",
        keywords: ["logs", "telemetry", "tracing", "monitoring", "metrics"],
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
        label: "Officer Login & Session",
        href: "/manual/01-getting-started/officer-login",
        keywords: ["login", "session", "auth", "credentials", "security"],
      },
      {
        label: "Workspace & Navigation",
        href: "/manual/01-getting-started/workspace-navigation",
        keywords: ["workspace", "tabs", "navigation", "dashboard", "menu"],
      },
    ],
  },
  {
    id: "02-daily-teller-operations",
    title: "02. Daily Teller Operations",
    icon: DollarSign,
    items: [
      {
        label: "Customer Inquiry",
        href: "/manual/02-daily-teller-operations/customer-inquiry",
        keywords: ["customer", "inquiry", "search", "account", "balance"],
      },
      {
        label: "Transaction Entry",
        href: "/manual/02-daily-teller-operations/transaction-entry",
        keywords: ["deposit", "withdrawal", "transfer", "transaction", "cash"],
      },
      {
        label: "Maker-Checker Authorization",
        href: "/manual/02-daily-teller-operations/maker-checker-authorization",
        keywords: ["maker", "checker", "override", "approval", "workflow"],
      },
    ],
  },
  {
    id: "03-reports-and-end-of-day",
    title: "03. Reports & EOD Processing",
    icon: PieChart,
    items: [
      {
        label: "Daily Branch Reports",
        href: "/manual/03-reports-and-end-of-day/daily-branch-reports",
        keywords: ["reports", "ledger", "balance", "audit", "daily"],
      },
      {
        label: "End of Day (EOD) Checklist",
        href: "/manual/03-reports-and-end-of-day/end-of-day-checklist",
        keywords: ["eod", "close", "checklist", "reconcile", "cutoff"],
      },
    ],
  },
  {
    id: "04-troubleshooting-and-support",
    title: "04. Troubleshooting & Support",
    icon: HelpCircle,
    items: [
      {
        label: "Common Errors & Solutions",
        href: "/manual/04-troubleshooting-and-support/common-errors",
        keywords: ["error", "solution", "troubleshooting", "network", "lock"],
      },
      {
        label: "IT Helpdesk & Escalation",
        href: "/manual/04-troubleshooting-and-support/helpdesk-escalation",
        keywords: ["helpdesk", "contact", "support", "escalation", "tickets"],
      },
    ],
  },
];
