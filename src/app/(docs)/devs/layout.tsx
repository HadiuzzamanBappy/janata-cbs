// Devs Documentation Portal Layout
"use client";

import { DEV_NAV_GROUPS, DocPortalLayout } from "@/features/docs";

export default function DevsDocLayout({ children }: { children: React.ReactNode }) {
  return (
    <DocPortalLayout
      navGroups={DEV_NAV_GROUPS}
      portalSidebarTitle="CBS - Developer"
      portalHeaderTitle="CBS Developer Hub"
      portalHomeHref="/devs"
      portalSubFolder="devs"
    >
      {children}
    </DocPortalLayout>
  );
}
