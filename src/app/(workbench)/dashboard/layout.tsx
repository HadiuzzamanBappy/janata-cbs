import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type * as React from "react";
import { WorkbenchShell } from "@/components/layout/workbench-shell";
import { appConfig } from "@/lib/core-config";
import { getSession } from "@/lib/infra-redis";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) {
    redirect(appConfig.routes.login);
  }

  const cookieStore = await cookies();
  const sidebarCookie = cookieStore.get("sidebar_state")?.value;
  // If cookie says "false", start collapsed with zero flicker; otherwise default to true
  const defaultOpen = sidebarCookie === undefined ? true : sidebarCookie === "true";

  return <WorkbenchShell defaultOpen={defaultOpen}>{children}</WorkbenchShell>;
}
