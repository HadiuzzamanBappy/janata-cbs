import type { LucideIcon } from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  keywords: string[];
  badge?: string;
}

export interface NavGroup {
  id: string;
  title: string;
  icon: LucideIcon;
  items: NavItem[];
}
