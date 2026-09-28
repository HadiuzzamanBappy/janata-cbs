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

export interface CompiledDocItem {
  sectionId: string;
  sectionTitle: string;
  itemTitle: string;
  href: string;
  content: string;
}

export interface PortalDocsBundle {
  portalTitle: string;
  generatedAt: string;
  items: CompiledDocItem[];
}

export interface PdfGenerationProgress {
  stage: string;
  percent: number;
}

export interface PdfGenerationResult {
  blob: Blob;
  fileName: string;
  save: () => void;
}
