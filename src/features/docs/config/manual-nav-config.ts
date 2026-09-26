import { BookOpen, DollarSign, HelpCircle, PieChart } from "lucide-react";
import type { NavGroup } from "./types";

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
    title: "03. Reports & End of Day",
    icon: PieChart,
    items: [
      {
        label: "Printing Daily Reports",
        href: "/manual/03-reports-and-end-of-day/printing-daily-reports",
        keywords: ["reports", "print", "ledger", "summary", "journal"],
      },
      {
        label: "COB Process Overview",
        href: "/manual/03-reports-and-end-of-day/cob-process-overview",
        keywords: ["cob", "close of business", "end of day", "eod", "batch"],
      },
    ],
  },
  {
    id: "04-troubleshooting",
    title: "04. Troubleshooting & FAQ",
    icon: HelpCircle,
    items: [
      {
        label: "Error Messages & FAQ",
        href: "/manual/04-troubleshooting/error-messages-faq",
        keywords: ["error", "faq", "help", "support", "troubleshooting"],
      },
    ],
  },
];
