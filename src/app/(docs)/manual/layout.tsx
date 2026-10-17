// Manual Documentation Portal Layout
"use client";

import { DocPortalLayout, MANUAL_NAV_GROUPS } from "@/features/docs";

export default function ManualDocLayout({ children }: { children: React.ReactNode }) {
  return (
    <DocPortalLayout
      navGroups={MANUAL_NAV_GROUPS}
      portalSidebarTitle="CBS - User Manual"
      portalHeaderTitle="CBS Officer Operating Manual"
      portalHomeHref="/manual"
      portalSubFolder="manual"
    >
      {children}
    </DocPortalLayout>
  );
}
