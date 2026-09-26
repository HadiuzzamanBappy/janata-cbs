// Unified Documentation Portal Layout (Powers /devs, /manual, and any future doc portal)
"use client";

import { use } from "react";
import {
  DEV_NAV_GROUPS,
  DocPortalLayout,
  MANUAL_NAV_GROUPS,
} from "@/features/docs";

export default function GenericDocLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ docs: string }>;
}) {
  const resolvedParams = use(params);
  const portal = resolvedParams.docs;

  const isManual = portal === "manual";
  const navGroups = isManual ? MANUAL_NAV_GROUPS : DEV_NAV_GROUPS;
  const sidebarTitle = isManual ? "CBS - User Manual" : "CBS - Developer";
  const headerTitle = isManual
    ? "CBS Officer Operating Manual"
    : "CBS Developer Hub";

  return (
    <DocPortalLayout
      navGroups={navGroups}
      portalSidebarTitle={sidebarTitle}
      portalHeaderTitle={headerTitle}
      portalHomeHref={`/${portal}`}
      portalSubFolder={portal}
    >
      {children}
    </DocPortalLayout>
  );
}
