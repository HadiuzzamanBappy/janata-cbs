import { redirect } from "next/navigation";
import type * as React from "react";
import { WorkbenchShell } from "@/components/layout/workbench-shell";
import { appConfig } from "@/lib/config";
import { getSession } from "@/lib/redis";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) {
    redirect(appConfig.routes.login);
  }

  return <WorkbenchShell>{children}</WorkbenchShell>;
}
